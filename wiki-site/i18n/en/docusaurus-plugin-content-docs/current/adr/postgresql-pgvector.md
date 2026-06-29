---
sidebar_position: 4
---

# ADR-003: Adopt PostgreSQL + pgvector

| Item | Description |
| --- | --- |
| **Context** | We want to handle business data and vector search on the same foundation in the future. We do not want to split operations. |
| **Decision** | Adopt PostgreSQL and integrate Vector DB via the pgvector extension rather than a dedicated product. |
| **Status** | Accepted |
| **Consequences** | Manage business + vectors in one DB. Centralize operations, backup, and permissions (ISMS alignment). |
| **Alternatives** | Dedicated Vector DB (Pinecone, etc.: increased operations, data sovereignty concerns) |

## Scaling Approach

- Separate search/statistics load with read replicas
- Optimize nearest-neighbor search on pgvector with IVFFlat / HNSW indexes
