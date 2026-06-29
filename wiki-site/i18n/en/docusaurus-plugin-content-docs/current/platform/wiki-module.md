---
sidebar_position: 3
---

# Wiki Module

Wiki is the **first module** on the platform. Map V1.0 finalized features to Platform capabilities.

## Wiki Features ↔ Platform Capabilities

| Wiki Feature (V1.0) | Platform Capability Used |
| --- | --- |
| Full-text search | Vector DB / Embedding (evolve to semantic search) |
| AI Reviewer / duplicate detection | Embedding + Knowledge Graph |
| AI assist (summary/tags) | Prompt Library + Knowledge Agent |
| Q&A resolution | RAG Engine (internal QA) |
| Future Auto FAQ | RAG + Workflow Engine |

## Post Types

| PostType | Description |
| --- | --- |
| `SHARE` | Experience sharing |
| `QUESTION` | Question |
| `REVIEW_ITEM` | Review item |
| `HOWTO` | How-to guide |
| `POSTMORTEM` | Postmortem |
| `BEST_PRACTICE` | Best practice |

## Post Lifecycle

```
DRAFT → SUBMITTED → REVIEW → APPROVED → PUBLISHED → ARCHIVED
                                              ↓
                                          DELETED (logical delete)
```

State transition API: `POST /posts/{id}/transition`  
Actions: `submit` / `approve` / `publish` / `archive` / `restore`

## Confidentiality Levels

| Confidentiality | Description |
| --- | --- |
| `PUBLIC` | Company-wide public |
| `INTERNAL` | Internal only |
| `DEPT` | Department only |
| `CONFIDENTIAL` | Confidential (no AI transmission · strict RBAC) |

## Evaluation and Contribution

- **Voting**: Upvote (+1) / downvote (-1). Self-voting is forbidden (`SELF_VOTE_FORBIDDEN`)
- **Multi-axis rating**: Usefulness, accuracy, novelty (each 1–5)
- **Verified mark**: Granted by reviewer or above
- **Contribution**: Answer (`ANSWER`) / supplement (`SUPPLEMENT`), best answer selection

## Statistics and Operations

| API | Purpose |
| --- | --- |
| `GET /stats/me` | Personal dashboard |
| `GET /stats/org` | Organization-wide statistics |
| `GET /stats/knowledge-gap` | Knowledge gap (areas with many unresolved items) |
| `GET /moderation/reports` | Report queue |

See [Wiki API Overview](../api/overview) for API details.
