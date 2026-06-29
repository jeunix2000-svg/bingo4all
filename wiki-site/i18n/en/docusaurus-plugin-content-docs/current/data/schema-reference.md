---
sidebar_position: 2
---

# Database Schema Reference

PostgreSQL 14+, `points` schema.

## Category Hierarchy

```
TECH (Technology)
├── LEGACY (Legacy COBOL/JCL)
├── AI (AI/LLM)
└── INFRA (Infrastructure)
BIZ (Business)
MGMT (Management)
DOMAIN (Customer industry knowledge)
```

## User Types

| code | Description | Exec/HR visibility |
| --- | --- | --- |
| `EMPLOYEE` | Full-time employee | Yes |
| `PARTNER` | On-site partner / contractor | No |

## Badges

| code | Name |
| --- | --- |
| `FIRST_POST` | First post |
| `STREAK` | Posting streak |
| `SAVIOR` | Savior (many questions resolved) |
| `GUARDIAN` | Knowledge guardian |
| `REVIEWER` | Review craftsman |
| `LEARN_FROM_FAIL` | Learn from failure |

## Triggers (Automatic Scoring)

| Trigger | Event | Rule |
| --- | --- | --- |
| `post_after_insert` | Post created | `POST_CREATE` |
| `vote_after_insert` | Vote | `POST_UPVOTED` / `POST_DOWNVOTED` + mutual upvote detection |
| `vote_before_insert` | Self-vote | **EXCEPTION rejection** |
| `contrib_after_insert` | Contribution created | `ANSWER_CREATE` / `SUPPLEMENT_CREATE` |
| `contrib_after_update` | Acceptance | `ANSWER_ACCEPTED` / `SUPPLEMENT_ACCEPTED` |

## Monthly Batch

`accrue_evergreen()` — +2 points monthly for evergreen posts with net upvotes ≥10 and age ≥90 days (compound effect).

## Anti-Gaming Alerts

`gaming_alert` table — records mutual upvote rings (`MUTUAL_VOTE_RING`), etc. for manual review.

Full DDL: [yfc_points_service.sql](/spec/yfc_points_service.sql)
