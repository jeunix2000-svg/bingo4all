---
sidebar_position: 2
---

# データベーススキーマリファレンス

PostgreSQL 14+、`points` スキーマ。

## カテゴリ階層

```
TECH（技術）
├── LEGACY（レガシー COBOL/JCL）
├── AI（AI/LLM）
└── INFRA（インフラ）
BIZ（業務）
MGMT（管理）
DOMAIN（顧客業種知見）
```

## ユーザー区分

| code | 説明 | 経営・人事閲覧 |
| --- | --- | --- |
| `EMPLOYEE` | 正社員 | 可 |
| `PARTNER` | 社内常駐／協力会社 | 不可 |

## バッジ

| code | 名称 |
| --- | --- |
| `FIRST_POST` | 初投稿 |
| `STREAK` | 連続投稿 |
| `SAVIOR` | 救世主（多数の疑問解決） |
| `GUARDIAN` | 知識の番人 |
| `REVIEWER` | レビュー職人 |
| `LEARN_FROM_FAIL` | 失敗から学ぶ |

## トリガー（自動採点）

| トリガー | イベント | ルール |
| --- | --- | --- |
| `post_after_insert` | 投稿作成 | `POST_CREATE` |
| `vote_after_insert` | 投票 | `POST_UPVOTED` / `POST_DOWNVOTED` + 相互いいね検知 |
| `vote_before_insert` | 自票 | **EXCEPTION 拒否** |
| `contrib_after_insert` | 貢献作成 | `ANSWER_CREATE` / `SUPPLEMENT_CREATE` |
| `contrib_after_update` | 採択 | `ANSWER_ACCEPTED` / `SUPPLEMENT_ACCEPTED` |

## 月次バッチ

`accrue_evergreen()` — 正味いいね≥10 かつ 90 日以上経過の常緑記事に毎月 +2 点（複利）。

## 不正防止アラート

`gaming_alert` テーブル — 相互いいねリング (`MUTUAL_VOTE_RING`) 等を記録し人工レビュー。

完全 DDL は [yfc_points_service.sql](/spec/yfc_points_service.sql) を参照。
