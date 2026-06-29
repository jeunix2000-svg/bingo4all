// wiki-module/test/posts.api.test.ts
// 実HTTPでposts CRUDを調通させる結合テスト。
// 実行: node --import tsx --test test/posts.api.test.ts
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { buildApp } from '../src/app.ts';
import { InMemoryPostRepository } from '../src/modules/posts/inMemory.repository.ts';
import { InMemoryVoteRepository } from '../src/modules/votes/inMemory.voteRepository.ts';
import { InMemoryRatingRepository } from '../src/modules/ratings/inMemory.ratingRepository.ts';
import { InMemoryContributionRepository } from '../src/modules/contributions/inMemory.contributionRepository.ts';

let server: Server;
let base: string;
const AUTHOR = { 'x-user-id': 'author-1', 'x-user-role': 'EMPLOYEE', 'content-type': 'application/json' };
const OTHER  = { 'x-user-id': 'other-9',  'x-user-role': 'EMPLOYEE', 'content-type': 'application/json' };
const MOD    = { 'x-user-id': 'mod-1',     'x-user-role': 'MODERATOR', 'content-type': 'application/json' };

before(async () => {
  const app = buildApp({
    posts: new InMemoryPostRepository(),
    votes: new InMemoryVoteRepository(),
    ratings: new InMemoryRatingRepository(),
    contributions: new InMemoryContributionRepository(),
    points: { async emit() {} },
  });
  await new Promise<void>((res) => { server = app.listen(0, () => res()); });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  base = `http://127.0.0.1:${port}`;
});
after(() => server?.close());

const validPost = () => ({
  title: 'COBOL移行の落とし穴', categoryCode: 'LEGACY', postType: 'POSTMORTEM',
  summary: '', body: '# 本文\n移行時の注意点...', confidentiality: 'INTERNAL', tags: [],
});
const j = (h: Record<string,string>, body?: unknown) =>
  ({ headers: h, ...(body ? { body: JSON.stringify(body) } : {}) });

test('健康チェック', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
});

test('認証なしは401', async () => {
  const r = await fetch(`${base}/api/v1/posts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
});

test('バリデーションエラーは400', async () => {
  const r = await fetch(`${base}/api/v1/posts`, { method: 'POST', ...j(AUTHOR, { title: '' }) });
  assert.equal(r.status, 400);
  const b = await r.json(); assert.equal(b.code, 'VALIDATION_ERROR');
});

let createdId = '';

test('POST /posts 作成は201・AI概要が自動補完される', async () => {
  const r = await fetch(`${base}/api/v1/posts`, { method: 'POST', ...j(AUTHOR, validPost()) });
  assert.equal(r.status, 201);
  const b = await r.json();
  assert.ok(b.id); assert.equal(b.status, 'DRAFT'); assert.equal(b.authorId, 'author-1');
  assert.match(b.summary, /自動概要/);   // 機密でないのでAIが補完
  createdId = b.id;
});

test('GET /posts/:id 詳細取得は200', async () => {
  const r = await fetch(`${base}/api/v1/posts/${createdId}`, { headers: AUTHOR });
  assert.equal(r.status, 200);
  const b = await r.json(); assert.equal(b.id, createdId); assert.ok(b.body.includes('本文'));
});

test('GET /posts 一覧はページング構造を返す', async () => {
  const r = await fetch(`${base}/api/v1/posts?page=1&size=10`, { headers: AUTHOR });
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.page, 1); assert.equal(b.size, 10); assert.ok(b.total >= 1);
  assert.ok(Array.isArray(b.items));
});

test('GET /posts?q= 検索が効く', async () => {
  const hit  = await (await fetch(`${base}/api/v1/posts?q=COBOL`, { headers: AUTHOR })).json();
  const miss = await (await fetch(`${base}/api/v1/posts?q=NONEXISTENT`, { headers: AUTHOR })).json();
  assert.ok(hit.total >= 1); assert.equal(miss.total, 0);
});

test('PUT /posts/:id 他人は編集不可（403）', async () => {
  const r = await fetch(`${base}/api/v1/posts/${createdId}`, { method: 'PUT', ...j(OTHER, { ...validPost(), title: '改ざん' }) });
  assert.equal(r.status, 403);
});

test('PUT /posts/:id 作者は編集可（200）', async () => {
  const r = await fetch(`${base}/api/v1/posts/${createdId}`, { method: 'PUT', ...j(AUTHOR, { ...validPost(), title: '改訂版タイトル' }) });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).title, '改訂版タイトル');
});

test('状態遷移 submit→approve(mod)→publish(mod)', async () => {
  let r = await fetch(`${base}/api/v1/posts/${createdId}/transition`, { method: 'POST', ...j(AUTHOR, { action: 'submit' }) });
  assert.equal((await r.json()).status, 'SUBMITTED');
  r = await fetch(`${base}/api/v1/posts/${createdId}/transition`, { method: 'POST', ...j(MOD, { action: 'approve' }) });
  assert.equal((await r.json()).status, 'APPROVED');
  r = await fetch(`${base}/api/v1/posts/${createdId}/transition`, { method: 'POST', ...j(MOD, { action: 'publish' }) });
  assert.equal((await r.json()).status, 'PUBLISHED');
});

test('不正な状態遷移は409', async () => {
  // PUBLISHED から submit は不可
  const r = await fetch(`${base}/api/v1/posts/${createdId}/transition`, { method: 'POST', ...j(AUTHOR, { action: 'submit' }) });
  assert.equal(r.status, 409);
  assert.equal((await r.json()).code, 'POST_INVALID_TRANSITION');
});

test('submit以外の遷移は権限者のみ（一般社員は403）', async () => {
  const c = await (await fetch(`${base}/api/v1/posts`, { method: 'POST', ...j(AUTHOR, validPost()) })).json();
  await fetch(`${base}/api/v1/posts/${c.id}/transition`, { method: 'POST', ...j(AUTHOR, { action: 'submit' }) });
  const r = await fetch(`${base}/api/v1/posts/${c.id}/transition`, { method: 'POST', ...j(AUTHOR, { action: 'approve' }) });
  assert.equal(r.status, 403);
});

test('機密区分=機密はAIに送らない（概要は空のまま）', async () => {
  const r = await fetch(`${base}/api/v1/posts`, { method: 'POST', ...j(AUTHOR, { ...validPost(), confidentiality: 'CONFIDENTIAL', summary: '' }) });
  const b = await r.json();
  assert.equal(b.summary, '');   // AI補完されない
});

test('DELETE /posts/:id 論理削除→以後404', async () => {
  const r = await fetch(`${base}/api/v1/posts/${createdId}`, { method: 'DELETE', headers: MOD });
  assert.equal(r.status, 204);
  const g = await fetch(`${base}/api/v1/posts/${createdId}`, { headers: AUTHOR });
  assert.equal(g.status, 404);
});
