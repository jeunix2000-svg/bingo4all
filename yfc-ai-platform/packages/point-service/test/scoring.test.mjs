// packages/point-service/test/scoring.test.mjs
// 実行: node --test   (依存ゼロ。Node 22 内蔵テストランナー)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, SelfVoteForbiddenError, DailyCapReachedError, clampWeight } from '../src/domain/scoring.js';
import { getRule } from '../src/domain/pointRules.js';
import { evaluatePromotion } from '../src/domain/reviewerPromotion.js';

const noCap = { countToday: () => 0 };

test('投稿作成で +5', () => {
  const r = evaluate({ ruleCode: 'POST_CREATE', beneficiaryId: 'u1' }, noCap);
  assert.equal(r.points, 5);
});

test('ベストアンサー採択で +15', () => {
  const r = evaluate({ ruleCode: 'ANSWER_ACCEPTED', beneficiaryId: 'u1' }, noCap);
  assert.equal(r.points, 15);
});

test('低質ペナルティで -3', () => {
  const r = evaluate({ ruleCode: 'LOW_QUALITY_PENALTY', beneficiaryId: 'u1' }, noCap);
  assert.equal(r.points, -3);
});

test('自票（いいね）は拒否される', () => {
  assert.throws(
    () => evaluate({ ruleCode: 'UPVOTE_RECEIVED', beneficiaryId: 'u1', actorId: 'u1' }, noCap),
    SelfVoteForbiddenError
  );
});

test('他者からのいいねは加算される', () => {
  const r = evaluate({ ruleCode: 'UPVOTE_RECEIVED', beneficiaryId: 'u1', actorId: 'u2' }, noCap);
  assert.equal(r.points, 1);
});

test('信誉加重：高信誉の評価は重みが増す', () => {
  const r = evaluate({ ruleCode: 'UPVOTE_RECEIVED', beneficiaryId: 'u1', actorId: 'u2', raterReputation: 2.0 }, noCap);
  assert.equal(r.weight, 2.0);
  assert.equal(r.points, 2);
});

test('重みは0.5〜2.0にクランプされる', () => {
  assert.equal(clampWeight(5), 2.0);
  assert.equal(clampWeight(0.1), 0.5);
  assert.equal(clampWeight(1.3), 1.3);
});

test('評価の日次上限（5回）を超えると拒否', () => {
  const capped = { countToday: () => 5 };
  assert.throws(
    () => evaluate({ ruleCode: 'RATING_GIVE', beneficiaryId: 'u2', actorId: 'u1' }, capped),
    DailyCapReachedError
  );
});

test('日次上限内（4回目）は許可', () => {
  const within = { countToday: () => 4 };
  const r = evaluate({ ruleCode: 'RATING_GIVE', beneficiaryId: 'u2', actorId: 'u1' }, within);
  assert.equal(r.points, 1);
});

test('未知ルールは例外', () => {
  assert.throws(() => getRule('NOPE'), /Unknown point rule/);
});

test('レビュアー昇格：全条件満たすと昇格', () => {
  const r = evaluatePromotion({ reputation: 85, recentContributions: 22, violations: 0 });
  assert.equal(r.promote, true);
});

test('レビュアー昇格：信誉不足は非昇格', () => {
  const r = evaluatePromotion({ reputation: 79, recentContributions: 30, violations: 0 });
  assert.equal(r.promote, false);
  assert.match(r.reasons[0], /reputation/);
});

test('レビュアー昇格：違反ありは非昇格', () => {
  const r = evaluatePromotion({ reputation: 90, recentContributions: 40, violations: 1 });
  assert.equal(r.promote, false);
});
