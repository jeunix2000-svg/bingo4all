---
sidebar_position: 3
---

# Test Strategy

## Test Types

| Type | Target | Tool (planned) | Criteria |
| --- | --- | --- | --- |
| **Unit** | Scoring functions · domain logic | Jest / Vitest | Coverage ≥ 80% |
| **Integration** | API + DB · contract tests | Supertest / pgTAP | All major APIs |
| **E2E** | Key scenarios (post → acceptance) | Playwright | Must-path coverage |
| **Security** | STRIDE item verification | ZAP / CodeQL | Zero vulnerabilities |
| **Performance** | TPS/P95 ([Performance Requirements](../design/nfr-performance)) | k6 / Locust | SLO met |
| **AI Prompt** | Output validity per Agent | Fixed-input regression | Stable schema/credibility |

## Focus Test Cases

### Scoring (Points Service)

- Self-vote → `SELF_VOTE_FORBIDDEN` / DB EXCEPTION
- Daily cap exceeded → 0 points (silent discard)
- Mutual upvote ring → `gaming_alert` recorded
- `point_event` UNIQUE duplicate → 0 points (idempotent)

### Wiki API

- Invalid state transition → 409 Conflict
- Insufficient RBAC → 403 Forbidden
- Confidentiality level filter

### AI

- `CONFIDENTIAL` body blocked at Gateway
- Prompt regression (fixed input → expected schema)

## CI Gate

PR merge conditions: Unit ≥ 80% + Integration pass + CodeQL zero + Claude Review approval.
