// wiki-module/test/integration.points.test.ts
// Wiki↔積分サービスの「真の打通」を実HTTPで検証する結合テスト。
// Wikiの DirectPointsClient が point-service の AwardPointsUseCase（InMemory台帳）を直接呼ぶ。
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { buildApp } from '../src/app.ts';
import { InMemoryPostRepository } from '../src/modules/posts/inMemory.repository.ts';
import { InMemoryVoteRepository } from '../src/modules/votes/inMemory.voteRepository.ts';
import { InMemoryRatingRepository } from '../src/modules/ratings/inMemory.ratingRepository.ts';
import { InMemoryContributionRepository } from '../src/modules/contributions/inMemory.contributionRepository.ts';
import { DirectPointsClient } from '../src/shared/pointsClient.ts';
// point-service（独自IP）を同一プロセスで結合
// @ts-ignore — 別パッケージのJS実装（tsxで実行、型はanyで可）
import { AwardPointsUseCase } from '../../point-service/src/application/awardPoints.js';
// @ts-ignore
import { InMemoryLedgerRepository } from '../../point-service/src/infrastructure/inMemoryLedgerRepository.js';

let server: Server, base: string, ledger: InMemoryLedgerRepository;
const H = (id: string, role = 'EMPLOYEE') => ({ 'x-user-id': id, 'x-user-role': role, 'content-type': 'application/json' });
const post = (p: string, h: Record<string,string>, body?: unknown) =>
  fetch(`${base}${p}`, { method: 'POST', headers: h, ...(body ? { body: JSON.stringify(body) } : {}) });
const balance = (uid: string) => ledger.getBalance(uid);

before(async () => {
  ledger = new InMemoryLedgerRepository();
  const award = new AwardPointsUseCase(ledger);
  const app = buildApp({
    posts: new InMemoryPostRepository(),
    votes: new InMemoryVoteRepository(),
    ratings: new InMemoryRatingRepository(),
    contributions: new InMemoryContributionRepository(),
    points: new DirectPointsClient(award),       // ← Wiki→積分 を実結線
  });
  await new Promise<void>((res) => { server = app.listen(0, () => res()); });
  const a = server.address(); base = `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`;
});
after(() => server?.close());

const newPost = () => ({ title: 'Q: JCLのRC', categoryCode: 'LEGACY', postType: 'QUESTION', summary: 's', body: 'b', confidentiality: 'INTERNAL' });

test('投稿作成で著者に+5が記帳される', async () => {
  const r = await post('/api/v1/posts', H('author'), newPost());
  const p = await r.json();
  assert.equal(await balance('author'), 5);
  return p;
});

test('他者のいいねで著者に+1（UPVOTE_RECEIVED）', async () => {
  const p = await (await post('/api/v1/posts', H('A'), newPost())).json();
  const before = await balance('A');               // 作成で+5済
  const r = await post(`/api/v1/posts/${p.id}/votes`, H('voterB'), { direction: 1 });
  assert.equal(r.status, 201);
  assert.equal(await balance('A'), before + 1);
});

test('自分の投稿への自票は403、加点なし', async () => {
  const p = await (await post('/api/v1/posts', H('selfC'), newPost())).json();
  const before = await balance('selfC');
  const r = await post(`/api/v1/posts/${p.id}/votes`, H('selfC'), { direction: 1 });
  assert.equal(r.status, 403);
  assert.equal(await balance('selfC'), before);     // 不変
});

test('評価(RATING_GIVE)で評価者に+1、日次上限5を超えると以後加点されない', async () => {
  const p = await (await post('/api/v1/posts', H('owner'), newPost())).json();
  const rater = 'raterX';
  // 6回評価（refId は postId:rater で同一 → 冪等で1回しか入らない設計のため、複数postで上限検証）
  let posts: string[] = [];
  for (let i = 0; i < 6; i++) posts.push((await (await post('/api/v1/posts', H(`o${i}`), newPost())).json()).id);
  const start = await balance(rater);
  for (const pid of posts) await post(`/api/v1/posts/${pid}/ratings`, H(rater), { usefulness: 5, accuracy: 4, novelty: 3 });
  // 上限5 → 最大+5まで
  assert.equal(await balance(rater), start + 5);
});

test('ベストアンサー採択：回答者+15、投稿者+20、解決へ', async () => {
  const q = await (await post('/api/v1/posts', H('asker'), newPost())).json();
  const c = await (await post(`/api/v1/posts/${q.id}/contributions`, H('answerer'), { kind: 'ANSWER', body: 'A' })).json();
  assert.equal(await balance('answerer'), 3);       // 回答作成 +3
  const before = await balance('answerer');
  const r = await post(`/api/v1/contributions/${c.id}/accept`, H('asker'));   // 質問者が採択
  assert.equal(r.status, 200);
  assert.equal((await r.json()).isAccepted, true);
  assert.equal(await balance('answerer'), before + 15);   // 採択 +15
  // 投稿者(asker)は 作成+5 と POST_BEST_ANSWER+20
  assert.equal(await balance('asker'), 5 + 20);
});

test('採択は権限者/質問者のみ（無関係ユーザーは403）', async () => {
  const q = await (await post('/api/v1/posts', H('asker2'), newPost())).json();
  const c = await (await post(`/api/v1/posts/${q.id}/contributions`, H('answerer2'), { kind: 'ANSWER', body: 'A' })).json();
  const r = await post(`/api/v1/contributions/${c.id}/accept`, H('stranger'));
  assert.equal(r.status, 403);
});

test('補足の採択は+8（SUPPLEMENT_ACCEPTED）', async () => {
  const q = await (await post('/api/v1/posts', H('asker3'), newPost())).json();
  const c = await (await post(`/api/v1/posts/${q.id}/contributions`, H('helper'), { kind: 'SUPPLEMENT', body: 'S' })).json();
  assert.equal(await balance('helper'), 2);          // 補足作成 +2
  await post(`/api/v1/contributions/${c.id}/accept`, H('asker3', 'MODERATOR'));   // モデレータ採択
  assert.equal(await balance('helper'), 2 + 8);      // 採択 +8
});
