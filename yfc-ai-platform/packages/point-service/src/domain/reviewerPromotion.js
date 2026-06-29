// packages/point-service/src/domain/reviewerPromotion.js
// レビュアー自動昇格判定（設計書V1.0 11.2 の定量条件）。
// 条件: 領域信誉 ≥ 80 かつ 直近90日の有効貢献 ≥ 20 かつ 違反記録 = 0

export const PROMOTION_THRESHOLDS = Object.freeze({
  MIN_REPUTATION: 80,
  MIN_RECENT_CONTRIBUTIONS: 20,
  MAX_VIOLATIONS: 0,
});

/**
 * @param {{ reputation:number, recentContributions:number, violations:number }} stats
 * @returns {{ promote:boolean, reasons:string[] }}
 */
export function evaluatePromotion(stats) {
  const reasons = [];
  if (stats.reputation < PROMOTION_THRESHOLDS.MIN_REPUTATION)
    reasons.push(`reputation ${stats.reputation} < ${PROMOTION_THRESHOLDS.MIN_REPUTATION}`);
  if (stats.recentContributions < PROMOTION_THRESHOLDS.MIN_RECENT_CONTRIBUTIONS)
    reasons.push(`recentContributions ${stats.recentContributions} < ${PROMOTION_THRESHOLDS.MIN_RECENT_CONTRIBUTIONS}`);
  if (stats.violations > PROMOTION_THRESHOLDS.MAX_VIOLATIONS)
    reasons.push(`violations ${stats.violations} > ${PROMOTION_THRESHOLDS.MAX_VIOLATIONS}`);
  return { promote: reasons.length === 0, reasons };
}
