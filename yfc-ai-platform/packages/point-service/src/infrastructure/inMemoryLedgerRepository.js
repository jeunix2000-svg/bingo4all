// packages/point-service/src/infrastructure/inMemoryLedgerRepository.js
// テスト/PoC用の台帳実装（DB非依存）。Wiki↔積分の結合検証に用いる。
export class InMemoryLedgerRepository {
  constructor() {
    this.events = [];                 // 追加専用台帳
    this.balances = new Map();        // user_id -> total
    this.seen = new Set();            // 冪等キー
  }
  key(e) { return `${e.ruleCode}|${e.refType}|${e.refId}|${e.beneficiaryId}`; }

  async exists(e) { return this.seen.has(this.key(e)); }

  async countToday(ruleCode, actorId) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.events.filter(x => x.ruleCode === ruleCode && x.actorId === actorId && x.ts >= start).length;
  }

  async appendEvent(e) {
    this.seen.add(this.key(e));
    this.events.push({ ...e, ts: new Date() });
  }
  async incrementBalance(userId, delta) {
    const v = (this.balances.get(userId) ?? 0) + delta;
    this.balances.set(userId, v); return v;
  }
  async getBalance(userId) { return this.balances.get(userId) ?? 0; }
}
