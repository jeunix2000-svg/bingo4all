---
sidebar_position: 3
---

# Wiki 模块

Wiki 是平台上的 **第 1 模块**。将 V1.0 确定的功能与 Platform 能力对应。

## Wiki 功能 ↔ Platform 能力

| Wiki 功能（V1.0） | 使用的 Platform 能力 |
| --- | --- |
| 全文搜索 | Vector DB / Embedding（向语义搜索演进） |
| AI Reviewer / 重复检测 | Embedding + Knowledge Graph |
| AI 辅助（摘要/标签） | Prompt Library + Knowledge Agent |
| 疑问解答 | RAG Engine（内部 QA） |
| 未来 Auto FAQ | RAG + Workflow Engine |

## 投稿类型

| PostType | 说明 |
| --- | --- |
| `SHARE` | 经验分享 |
| `QUESTION` | 疑问提出 |
| `REVIEW_ITEM` | 审议事项 |
| `HOWTO` | 操作手册 |
| `POSTMORTEM` | 失败案例 |
| `BEST_PRACTICE` | 最佳实践 |

## 投稿生命周期

```
DRAFT → SUBMITTED → REVIEW → APPROVED → PUBLISHED → ARCHIVED
                                              ↓
                                          DELETED（逻辑删除）
```

状态迁移 API: `POST /posts/{id}/transition`  
操作: `submit` / `approve` / `publish` / `archive` / `restore`

## 机密等级

| Confidentiality | 说明 |
| --- | --- |
| `PUBLIC` | 全公司公开 |
| `INTERNAL` | 内部限定 |
| `DEPT` | 部门限定 |
| `CONFIDENTIAL` | 机密（AI 不发送·严格 RBAC） |

## 评价·贡献

- **投票**: 点赞 (+1) / 差评 (-1)。禁止自投（`SELF_VOTE_FORBIDDEN`）
- **多轴评价**: 实用性·准确性·新颖性（各 1〜5）
- **已验证标记**: 由 Reviewer 及以上授予
- **贡献**: 回答 (`ANSWER`) / 补充 (`SUPPLEMENT`)，最佳答案采纳

## 统计·运维

| API | 用途 |
| --- | --- |
| `GET /stats/me` | 个人仪表盘 |
| `GET /stats/org` | 全公司统计 |
| `GET /stats/knowledge-gap` | 知识缺口（未解决较多的领域） |
| `GET /moderation/reports` | 举报队列 |

API 详情参见 [Wiki API 概要](../api/overview)。
