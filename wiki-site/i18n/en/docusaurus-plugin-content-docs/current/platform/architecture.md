---
sidebar_position: 2
---

# Platform Architecture

## Layer Structure

```
┌─────────────────────────────────────────────────────┐
│  AI Applications (Sales Report AI / Hiring AI / COBOL Migration AI …) │
├─────────────────────────────────────────────────────┤
│  Wiki Module (Module 1) — Posts · Ratings · Search · Dashboard   │
├─────────────────────────────────────────────────────┤
│  Platform Core                                      │
│  Knowledge Graph │ Embedding │ Vector DB │ RAG Engine │
│  Agent Memory    │ Workflow  │ Prompt Library │ MCP  │
├─────────────────────────────────────────────────────┤
│  Infrastructure — PostgreSQL+pgvector / Entra ID / Azure │
└─────────────────────────────────────────────────────┘
```

## Platform Capabilities (8 Components)

| Capability | Role | Technology (planned) | Phase |
| --- | --- | --- | --- |
| **Knowledge Graph** | Structure relationships among knowledge, people, and domains | PostgreSQL / graph extension | Phase 2 |
| **Embedding** | Vectorize body text and questions | Claude / embedding model | Phase 2 |
| **Vector DB** | Similarity search, nearest-neighbor exploration | PostgreSQL + pgvector | Phase 2 |
| **RAG Engine** | Context-aware answer generation | Claude + search | Phase 2-3 |
| **Agent Memory** | Remember conversations and usage context | DB + session | Phase 3 |
| **Workflow Engine** | Business flow orchestration | In-house / OSS | Phase 3 |
| **Prompt Library** | Centralized prompt asset management | Repository management | Phase 1- |
| **MCP Gateway** | External tool/data connectivity | MCP | Phase 3-4 |

## Core Services

| Service | Role | Technology |
| --- | --- | --- |
| Wiki core | Posts, search, permissions, Markdown | Wiki.js (OSS) |
| Points Service | Scoring, ledger, rankings | Node/Express + PostgreSQL |
| AI Gateway | LLM invocation, confidentiality control | Claude API + Gateway |

Authentication uses **Entra ID (OIDC)** Bearer tokens. Wiki API base URLs:

- Production: `https://wiki.yfc.internal/api/v1`
- Staging: `https://wiki-stg.yfc.internal/api/v1`

See [Wiki Module](./wiki-module) and [ADR](../adr/overview) for details.
