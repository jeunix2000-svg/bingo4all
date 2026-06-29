---
sidebar_position: 2
---

# Non-Functional Requirements (Performance and Capacity)

Quantified metrics assuming PoC through initial production (approx. 1,000 users · 100,000 posts).

## TPS / Response Time (P95)

| Operation | Target TPS | P95 Response | Notes |
| --- | --- | --- | --- |
| Login (SSO) | 200 TPS | ≤ 800ms | Includes Entra delegation |
| Search (list/full-text) | 100 TPS | ≤ 1,000ms | Maintained after semantic search migration |
| Post (create/update) | 50 TPS | ≤ 1,500ms | AI assist may be async |
| Rating/vote | 100 TPS | ≤ 600ms | Includes self-vote rejection |
| AI assist/RAG | 20 concurrent | ≤ 6s (generation) | LLM rate control |

## Capacity and Scaling Approach

### Horizontal Scaling

Wiki / Point / AI Gateway are **stateless** and scale via container replication.

### Database

- Separate search/statistics load with read replicas
- Optimize nearest-neighbor search on pgvector with IVFFlat / HNSW indexes

### AI Concurrency

- Queue control with a cap of 20 concurrent executions
- Async on burst (summary/tags may be applied later)

### Measurement

Set SLO (TPS/P95) per operation and detect regression in CI load tests ([Test Strategy](../devops/test-strategy)).
