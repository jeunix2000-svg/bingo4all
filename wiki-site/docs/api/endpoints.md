---
sidebar_position: 2
---

# API エンドポイント一覧

## 投稿 (posts / search)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/posts` | 投稿一覧・検索（`q`, `category`, `postType`, `sort`, ページング） |
| `POST` | `/posts` | 投稿作成 |
| `GET` | `/posts/{id}` | 投稿詳細 |
| `PUT` | `/posts/{id}` | 投稿編集 |
| `DELETE` | `/posts/{id}` | 論理削除 |
| `POST` | `/posts/{id}/transition` | 状態遷移 |

## 評価 (evaluation)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `POST` | `/posts/{id}/votes` | いいね/低評価（`direction`: 1 / -1） |
| `POST` | `/posts/{id}/ratings` | 多軸価値評価（実用性・正確性・新規性） |
| `POST` | `/posts/{id}/verify` | 検証済みマーク（レビュアー以上） |

## 貢献 (contributions)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/posts/{id}/contributions` | 回答・補足一覧 |
| `POST` | `/posts/{id}/contributions` | 回答/補足投稿 |
| `POST` | `/contributions/{id}/accept` | ベストアンサー/補足採択 |

## 統計 (stats)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/stats/me` | 個人ダッシュボード |
| `GET` | `/stats/org` | 全社統計 |
| `GET` | `/stats/knowledge-gap` | ナレッジ・ギャップ |

## 運用 (moderation)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/moderation/reports` | 通報キュー |
| `POST` | `/moderation/reports` | 投稿通報 |

## AI (ai)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `POST` | `/ai/assist` | 概要/分類/タグ/重複/推敲 |
| `POST` | `/ai/review` | AI Reviewer（信頼度・参考資料） |

## 主要スキーマ

### PostCreate（必須フィールド）

- `title`, `categoryCode`, `postType`, `summary`, `body`, `confidentiality`
- 任意: `tags[]`, `attachmentIds[]`

### ValueRating

- `usefulness`, `accuracy`, `novelty` — 各 1〜5

### UserStats

- `postCount`, `upvotesReceived`, `totalPoints`, `level`, `acceptedContribs`, `badges[]`

完全なスキーマ定義は [OpenAPI YAML](/spec/yfc_wiki_openapi.yaml) を参照。
