// packages/point-service/src/domain/pointRules.js
// 採点ルール（point_rule）— 設計書V1.0 第11章 / yfc_points_service.sql と整合する単一の真実源。
// DB側 V2__points_rules_seed.sql と同一値を保つこと。

/** @typedef {{ basePoints:number, dailyCap:number|null, reputationWeighted:boolean, description:string }} PointRule */

/** @type {Record<string, PointRule>} */
export const POINT_RULES = {
  POST_CREATE:        { basePoints:  5, dailyCap: null, reputationWeighted: false, description: '投稿作成' },
  ANSWER_CREATE:      { basePoints:  3, dailyCap: null, reputationWeighted: false, description: '疑問への回答' },
  SUPPLEMENT_CREATE:  { basePoints:  2, dailyCap: null, reputationWeighted: false, description: '有効な補足' },
  RATING_GIVE:        { basePoints:  1, dailyCap: 5,    reputationWeighted: false, description: '誠実な評価（日次上限）' },
  UPVOTE_RECEIVED:    { basePoints:  1, dailyCap: null, reputationWeighted: true,  description: 'いいね獲得（評価者信誉で加重）' },
  ANSWER_ACCEPTED:    { basePoints: 15, dailyCap: null, reputationWeighted: false, description: 'ベストアンサー採択' },
  SUPPLEMENT_ACCEPTED:{ basePoints:  8, dailyCap: null, reputationWeighted: false, description: '補足の採択' },
  POST_BEST_ANSWER:   { basePoints: 20, dailyCap: null, reputationWeighted: false, description: '投稿にベストアンサーが付いた' },
  REFERENCED:         { basePoints:  3, dailyCap: null, reputationWeighted: false, description: '他投稿から参照された' },
  LOW_QUALITY_PENALTY:{ basePoints: -3, dailyCap: null, reputationWeighted: false, description: '低質投稿の多数低評価' },
};

export function getRule(ruleCode) {
  const rule = POINT_RULES[ruleCode];
  if (!rule) {
    const err = new Error(`Unknown point rule: ${ruleCode}`);
    err.code = 'UNKNOWN_RULE';
    throw err;
  }
  return rule;
}
