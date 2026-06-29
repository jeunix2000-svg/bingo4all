// wiki-module/src/shared/pointsClient.ts
// Wiki→積分サービスの連携クライアント。設計 ADR-002（Webhook連携の独立サービス）。
export interface PointEvent {
  ruleCode: string;
  beneficiaryId: string;      // ポイントを得る人
  actorId?: string;           // 行為者（投票者/評価者）。自票拒否・日次上限の判定に使う
  refType: string;
  refId: string;
  raterReputation?: number;   // reputationWeighted ルール用
}
export interface PointsClient { emit(e: PointEvent): Promise<void>; }

// 本番：point-service へHTTP POST（/api/v1/points/events）
export class HttpPointsClient implements PointsClient {
  constructor(private baseUrl: string) {}

  async emit(e: PointEvent): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/points/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(e),
      });
      // 自票(403)・上限(429)・サービス未起動(404/5xx)は積分のみスキップし Wiki 操作は成功させる
      if (!res.ok) {
        console.warn(JSON.stringify({
          level: 'warn',
          event: 'points_emit_skipped',
          status: res.status,
          ruleCode: e.ruleCode,
          refType: e.refType,
          refId: e.refId,
        }));
      }
    } catch (err) {
      console.warn(JSON.stringify({
        level: 'warn',
        event: 'points_emit_unavailable',
        ruleCode: e.ruleCode,
        refType: e.refType,
        refId: e.refId,
        message: (err as Error)?.message,
      }));
    }
  }
}

// 開発/テスト：point-service の AwardPointsUseCase を直接呼ぶ（同一プロセス結合）
export class DirectPointsClient implements PointsClient {
  constructor(private useCase: { execute(e: any): Promise<unknown> }) {}
  async emit(e: PointEvent): Promise<void> {
    try {
      await this.useCase.execute(e);
    } catch (err: any) {
      // 業務上の拒否（自票・日次上限）は積分のみ非加算とし、Wiki操作は成功させる。
      if (err?.code === 'SELF_VOTE_FORBIDDEN' || err?.code === 'DAILY_CAP_REACHED') return;
      throw err;
    }
  }
}
