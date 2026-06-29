---
sidebar_position: 3
---

# テスト戦略

## テスト種別

| 種別 | 対象 | ツール(想定) | 基準 |
| --- | --- | --- | --- |
| **Unit** | 採点関数・ドメインロジック | Jest / Vitest | カバレッジ ≥ 80% |
| **Integration** | API + DB・契約テスト | Supertest / pgTAP | 主要 API 全件 |
| **E2E** | 主要シナリオ（投稿〜採択） | Playwright | Must 経路網羅 |
| **Security** | STRIDE 項目の検証 | ZAP / CodeQL | 脆弱性ゼロ |
| **Performance** | TPS/P95 ([性能要件](../design/nfr-performance)) | k6 / Locust | SLO 達成 |
| **AI Prompt** | 各 Agent の出力妥当性 | 固定入力リグレッション | スキーマ/信頼度の安定 |

## 重点テストケース

### 採点 (Points Service)

- 自票 → `SELF_VOTE_FORBIDDEN` / DB EXCEPTION
- 日次上限超過 → 0 点（静默丢弃）
- 相互いいねリング → `gaming_alert` 記録
- `point_event` UNIQUE 重複 → 0 点（幂等）

### Wiki API

- 状態遷移の不正 → 409 Conflict
- RBAC 権限不足 → 403 Forbidden
- 機密区分フィルタ

### AI

- `CONFIDENTIAL` 本文の Gateway ブロック
- Prompt 回帰（固定入力 → 期待スキーマ）

## CI ゲート

PR マージ条件: Unit ≥ 80% + Integration 通過 + CodeQL ゼロ + Claude Review 承認。
