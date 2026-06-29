---
sidebar_position: 3
---

# セキュリティ脅威モデル（STRIDE）

STRIDE で脅威を体系化し、ISMS / P マーク統制と整合させる。

| 脅威 (STRIDE) | 対象 | 想定脅威 | 対策 |
| --- | --- | --- | --- |
| **Spoofing** | 認証 | なりすましログイン | Entra SSO/MFA・トークン検証・自社で資格情報を保持しない |
| **Tampering** | データ | 投稿/積分の改竄 | RBAC・入力検証・`point_event` 追加専用・整合性制約 |
| **Repudiation** | 操作 | 操作の否認 | 監査ログ (Audit Catalog)・追加専用台帳・`trace_id` |
| **Information Disclosure** | 機密 | 機密の誤公開/漏えい | 機密区分+権限フィルタ・保存時暗号化・機密本文は AI 非送信 |
| **Denial of Service** | 可用性 | 過負荷/濫用 | レート制限・TPS 上限・WAF・自動スケール |
| **Elevation of Privilege** | 権限 | 権限昇格 | 最小権限・権限変更を高重大度監査・DB アカウント分離 |

## AI 固有対策

**プロンプトインジェクション対策**:

- 外部入力をシステム指示と分離
- 機密データを AI に渡さない既定（Gateway 制御）
- `CONFIDENTIAL` 区分は AI Gateway でブロック

## エラーコード例

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "自己の投稿への投票は禁止",
  "traceId": "abc-123"
}
```

形式: `{DOMAIN}_{REASON}` — [コーディング規約](../devops/coding-standard) 参照。
