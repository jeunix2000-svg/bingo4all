---
sidebar_position: 2
---

# API 端点列表

## 投稿 (posts / search)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `GET` | `/posts` | 投稿列表·搜索（`q`, `category`, `postType`, `sort`, 分页） |
| `POST` | `/posts` | 创建投稿 |
| `GET` | `/posts/{id}` | 投稿详情 |
| `PUT` | `/posts/{id}` | 编辑投稿 |
| `DELETE` | `/posts/{id}` | 逻辑删除 |
| `POST` | `/posts/{id}/transition` | 状态迁移 |

## 评价 (evaluation)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `POST` | `/posts/{id}/votes` | 点赞/差评（`direction`: 1 / -1） |
| `POST` | `/posts/{id}/ratings` | 多轴价值评价（实用性·准确性·新颖性） |
| `POST` | `/posts/{id}/verify` | 已验证标记（Reviewer 及以上） |

## 贡献 (contributions)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `GET` | `/posts/{id}/contributions` | 回答·补充列表 |
| `POST` | `/posts/{id}/contributions` | 投稿回答/补充 |
| `POST` | `/contributions/{id}/accept` | 最佳答案/补充采纳 |

## 统计 (stats)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `GET` | `/stats/me` | 个人仪表盘 |
| `GET` | `/stats/org` | 全公司统计 |
| `GET` | `/stats/knowledge-gap` | 知识缺口 |

## 运维 (moderation)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `GET` | `/moderation/reports` | 举报队列 |
| `POST` | `/moderation/reports` | 举报投稿 |

## AI (ai)

| 方法 | 路径 | 概要 |
| --- | --- | --- |
| `POST` | `/ai/assist` | 概要/分类/标签/重复/润色 |
| `POST` | `/ai/review` | AI Reviewer（置信度·参考资料） |

## 主要 Schema

### PostCreate（必填字段）

- `title`, `categoryCode`, `postType`, `summary`, `body`, `confidentiality`
- 可选: `tags[]`, `attachmentIds[]`

### ValueRating

- `usefulness`, `accuracy`, `novelty` — 各 1〜5

### UserStats

- `postCount`, `upvotesReceived`, `totalPoints`, `level`, `acceptedContribs`, `badges[]`

完整 Schema 定义参见 [OpenAPI YAML](/spec/yfc_wiki_openapi.yaml)。
