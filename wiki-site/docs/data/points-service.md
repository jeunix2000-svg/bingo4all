---
sidebar_position: 1
---

# ポイント・マイクロサービス

YFC 社内 Wiki の **採点・ランキング・不正防止** を担う独立マイクロサービス（ADR-002）。

📄 DDL: [yfc_points_service.sql をダウンロード](/spec/yfc_points_service.sql)

## 設計方針（4 原則）

1. **`point_events` = 追加専用台帳 (append-only ledger)** — 唯一の真実の源泉。ISMS/監査ログに適合。
2. **残高/評価 = 派生集計** — `award_points()` が同一トランザクション内で同期更新。
3. **不正防止 (anti-gaming)** — 自票禁止 / 日次上限 / 評価者評価の重み付け / 相互いいね検知 / 低品質ペナルティ。
4. **質 > 量** — 基本点は低く、主な得点は他者評価・採択・参照から。ルールはデータ化 (`point_rule`)。

## スキーマ構成

| 区分 | テーブル | 説明 |
| --- | --- | --- |
| A. マスタ | `user_type`, `category`, `post_type`, `level_def`, `badge_def`, `point_rule` | 参照・採点ルール |
| B. ミラー | `app_user`, `post`, `contribution` | Wiki 側の最小ミラー |
| C. 評価 | `vote`, `value_rating` | 投票・多軸評価 |
| D. 台帳 | `point_event` | **追加専用・真実の源泉** |
| E. 集計 | `user_point_balance`, `user_domain_reputation`, `user_badge`, `gaming_alert` | 派生データ |

## コア関数 `award_points()`

採点の核心。同一トランザクション内で：

1. ルール取得（無効化時は 0 点）
2. 受益者決定（SELF / TARGET_AUTHOR）
3. 不正防止①：自己操作禁止
4. 不正防止②：日次上限
5. 評価者評価の重み付け（0.5〜1.5）
6. 台帳計上（UNIQUE による重複防止）
7. 残高 + レベル更新
8. ドメイン評価更新（≥800 で検証者資格）

## 採点ルール（シードデータ）

| rule_code | 説明 | 基本点 | 受益者 |
| --- | --- | --- | --- |
| `POST_CREATE` | 投稿 | +5 | SELF |
| `POST_UPVOTED` | +1 評価 | +1 | TARGET_AUTHOR |
| `POST_DOWNVOTED` | -1 評価（ペナルティ） | -3 | TARGET_AUTHOR |
| `POST_REFERENCED` | 参照された | +3 | TARGET_AUTHOR |
| `ANSWER_CREATE` | 回答 | +3 | SELF |
| `ANSWER_ACCEPTED` | 回答採択 | +15 | TARGET_AUTHOR |
| `SUPPLEMENT_CREATE` | 補足 | +2 | SELF |
| `SUPPLEMENT_ACCEPTED` | 補足採択 | +8 | TARGET_AUTHOR |
| `REVIEW_GIVEN` | 評価提供 | +1 | SELF |
| `REVIEW_HELPFUL` | 評価が有用 | +2 | TARGET_AUTHOR |
| `BEST_PRACTICE_BONUS` | BP 採用 | +10 | TARGET_AUTHOR |

## レベル

| level | code | 名称 | 最低ポイント |
| --- | --- | --- | --- |
| 1 | APPRENTICE | 見習い | 0 |
| 2 | REGULAR | 一般 | 100 |
| 3 | SENIOR | 上級 | 400 |
| 4 | EXPERT | エキスパート | 1200 |
| 5 | MEISTER | マイスター | 3000 |

## 運用ビュー

| ビュー | 用途 |
| --- | --- |
| `v_leaderboard` | 全社ランキング |
| `v_knowledge_gap` | ナレッジ・ギャップ（未解決疑問の多い領域） |
| `v_user_stats` | 個人統計 |
| `v_org_stats` | 全社ダッシュボード |

詳細テーブル定義: [スキーマリファレンス](./schema-reference)
