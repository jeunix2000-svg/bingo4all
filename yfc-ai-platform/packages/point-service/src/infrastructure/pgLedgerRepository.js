// packages/point-service/src/infrastructure/pgLedgerRepository.js
// PostgreSQL 実装（point_event は追加専用）。pg プールを注入。
// 注: 本ファイルは骨格。SQL は db/migrations のスキーマに対応。
export class LedgerRepository {
  constructor(pool) { this.pool = pool; }

  async exists(event) {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM points.point_event
       WHERE rule_code=$1 AND ref_type=$2 AND ref_id=$3 AND user_id=$4 LIMIT 1`,
      [event.ruleCode, event.refType, event.refId, event.beneficiaryId]
    );
    return rows.length > 0;
  }

  // 当日の(ルール,行為者)回数。日次上限の判定に使用。
  async countToday(ruleCode, actorId) {
    const { rows } = await this.pool.query(
      `SELECT count(*)::int AS c FROM points.point_event
       WHERE rule_code=$1 AND actor_id=$2 AND created_at >= date_trunc('day', now())`,
      [ruleCode, actorId]
    );
    return rows[0].c;
  }
  // 同期版が必要な箇所は事前ロードした値を渡す設計（ここでは簡易に0）

  async appendEvent(e) {
    await this.pool.query(
      `INSERT INTO points.point_event
       (user_id, actor_id, rule_code, points, ref_type, ref_id, category_code, weight)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [e.beneficiaryId, e.actorId ?? null, e.ruleCode, e.points, e.refType, e.refId, e.categoryCode ?? null, e.weight ?? 1.0]
    );
  }

  async incrementBalance(userId, delta) {
    const { rows } = await this.pool.query(
      `INSERT INTO points.user_point_balance (user_id, total_points)
       VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET total_points = points.user_point_balance.total_points + $2
       RETURNING total_points`,
      [userId, delta]
    );
    return rows[0].total_points;
  }

  async getBalance(userId) {
    const { rows } = await this.pool.query(
      `SELECT total_points FROM points.user_point_balance WHERE user_id=$1`, [userId]);
    return rows[0]?.total_points ?? 0;
  }
}
