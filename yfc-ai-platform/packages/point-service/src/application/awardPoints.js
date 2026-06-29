// packages/point-service/src/application/awardPoints.js
// ユースケース：採点イベントを評価し、台帳へ記帳して残高を更新する。
import { evaluate } from '../domain/scoring.js';

export class AwardPointsUseCase {
  /** @param {import('../infrastructure/pgLedgerRepository.js').LedgerRepository} repo */
  constructor(repo) { this.repo = repo; }

  /**
   * @param {object} event ruleCode/beneficiaryId/actorId/raterReputation/refType/refId
   * @returns {Promise<{points:number, balance:number}>}
   */
  async execute(event) {
    // 冪等性：同一(rule, refType, refId, beneficiary)は二重記帳しない
    if (await this.repo.exists(event)) {
      return { points: 0, balance: await this.repo.getBalance(event.beneficiaryId), idempotent: true };
    }
    // 日次上限の判定に使う「当日件数」を事前ロード（DBは非同期のため、同期evaluateに値で渡す）。
    // 注: count→insert は厳密には非原子。高並行では production で SELECT ... FOR UPDATE / 制約により担保する。
    let usedToday = 0;
    if (event.actorId) usedToday = await this.repo.countToday(event.ruleCode, event.actorId);
    const ledgerState = { countToday: () => usedToday };

    const result = evaluate(event, ledgerState);            // ドメイン（自票拒否/上限/加重）
    await this.repo.appendEvent({ ...event, ...result });   // 追加専用台帳へ記帳
    const balance = await this.repo.incrementBalance(result.beneficiaryId, result.points);
    return { points: result.points, balance };
  }
}
