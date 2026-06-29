// packages/point-service/src/domain/scoring.js
// 採点ドメインロジック（純粋関数）。DB非依存。ユニットテスト対象。
import { getRule } from './pointRules.js';

export class SelfVoteForbiddenError extends Error {
  constructor() { super('Self vote is forbidden'); this.code = 'SELF_VOTE_FORBIDDEN'; }
}
export class DailyCapReachedError extends Error {
  constructor(ruleCode) { super(`Daily cap reached for ${ruleCode}`); this.code = 'DAILY_CAP_REACHED'; }
}

/**
 * 採点イベントを評価し、付与ポイントを算出する。
 * @param {object} event
 * @param {string} event.ruleCode       - POINT_RULES のキー
 * @param {string} event.beneficiaryId  - 受益者（ポイントを得る人）
 * @param {string} [event.actorId]      - 行為者（投票者/評価者）。省略時は受益者と同一とみなさない
 * @param {number} [event.raterReputation] - reputationWeighted ルール用（0.5〜2.0想定、既定1.0）
 * @param {object} ledgerState
 * @param {(ruleCode:string, actorId:string)=>number} ledgerState.countToday - 当日の(ルール,行為者)回数
 * @returns {{ ruleCode:string, beneficiaryId:string, points:number, weight:number }}
 */
export function evaluate(event, ledgerState) {
  const rule = getRule(event.ruleCode);

  // 自票拒否：いいね等（reputationWeighted）で 行為者＝受益者 は不正。
  // 評価(RATING_GIVE)は「評価した本人が参加点を得る」設計のため自票拒否の対象外（日次上限で抑制）。
  if (rule.reputationWeighted && event.actorId && event.actorId === event.beneficiaryId) {
    throw new SelfVoteForbiddenError();
  }

  // 日次上限
  if (rule.dailyCap != null && event.actorId) {
    const used = ledgerState.countToday(event.ruleCode, event.actorId);
    if (used >= rule.dailyCap) throw new DailyCapReachedError(event.ruleCode);
  }

  // 信誉加重
  let weight = 1.0;
  if (rule.reputationWeighted) {
    weight = clampWeight(event.raterReputation ?? 1.0);
  }

  const points = Math.round(rule.basePoints * weight);
  return { ruleCode: event.ruleCode, beneficiaryId: event.beneficiaryId, points, weight };
}

export function clampWeight(w) {
  if (Number.isNaN(w)) return 1.0;
  return Math.min(2.0, Math.max(0.5, w));
}
