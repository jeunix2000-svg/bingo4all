---
sidebar_position: 1
---

# Points Microservice

Independent microservice responsible for **scoring, rankings, and anti-gaming** for the YFC internal Wiki (ADR-002).

📄 DDL: [Download yfc_points_service.sql](/spec/yfc_points_service.sql)

## Design Principles (4 Principles)

1. **`point_events` = append-only ledger** — Single source of truth. Suitable for ISMS/audit logs.
2. **Balance/ratings = derived aggregates** — `award_points()` synchronously updates within the same transaction.
3. **Anti-gaming** — Self-vote prohibition / daily cap / rater weighting / mutual upvote detection / low-quality penalty.
4. **Quality over quantity** — Base points are low; most points come from peer ratings, acceptance, and references. Rules are data-driven (`point_rule`).

## Schema Structure

| Category | Table | Description |
| --- | --- | --- |
| A. Master | `user_type`, `category`, `post_type`, `level_def`, `badge_def`, `point_rule` | Reference · scoring rules |
| B. Mirror | `app_user`, `post`, `contribution` | Minimal mirror from Wiki side |
| C. Evaluation | `vote`, `value_rating` | Votes · multi-axis ratings |
| D. Ledger | `point_event` | **Append-only · source of truth** |
| E. Aggregate | `user_point_balance`, `user_domain_reputation`, `user_badge`, `gaming_alert` | Derived data |

## Core Function `award_points()`

Core of scoring. Within the same transaction:

1. Fetch rule (0 points when disabled)
2. Determine beneficiary (SELF / TARGET_AUTHOR)
3. Anti-gaming ①: prohibit self-action
4. Anti-gaming ②: daily cap
5. Rater weighting (0.5–1.5)
6. Ledger entry (duplicate prevention via UNIQUE)
7. Balance + level update
8. Domain reputation update (verifier qualification at ≥800)

## Scoring Rules (Seed Data)

| rule_code | Description | Base Points | Beneficiary |
| --- | --- | --- | --- |
| `POST_CREATE` | Post | +5 | SELF |
| `POST_UPVOTED` | +1 rating | +1 | TARGET_AUTHOR |
| `POST_DOWNVOTED` | -1 rating (penalty) | -3 | TARGET_AUTHOR |
| `POST_REFERENCED` | Referenced | +3 | TARGET_AUTHOR |
| `ANSWER_CREATE` | Answer | +3 | SELF |
| `ANSWER_ACCEPTED` | Answer accepted | +15 | TARGET_AUTHOR |
| `SUPPLEMENT_CREATE` | Supplement | +2 | SELF |
| `SUPPLEMENT_ACCEPTED` | Supplement accepted | +8 | TARGET_AUTHOR |
| `REVIEW_GIVEN` | Review provided | +1 | SELF |
| `REVIEW_HELPFUL` | Review marked helpful | +2 | TARGET_AUTHOR |
| `BEST_PRACTICE_BONUS` | BP adoption | +10 | TARGET_AUTHOR |

## Levels

| level | code | Name | Minimum Points |
| --- | --- | --- | --- |
| 1 | APPRENTICE | Apprentice | 0 |
| 2 | REGULAR | Regular | 100 |
| 3 | SENIOR | Senior | 400 |
| 4 | EXPERT | Expert | 1200 |
| 5 | MEISTER | Meister | 3000 |

## Operational Views

| View | Purpose |
| --- | --- |
| `v_leaderboard` | Company-wide ranking |
| `v_knowledge_gap` | Knowledge gap (areas with many unresolved questions) |
| `v_user_stats` | Personal statistics |
| `v_org_stats` | Organization dashboard |

Table definitions: [Schema Reference](./schema-reference)
