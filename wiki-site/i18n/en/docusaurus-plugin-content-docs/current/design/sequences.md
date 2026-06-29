---
sidebar_position: 1
---

# Sequence Design

Shows timing for major flows as a baseline for implementation and debugging.

## 4.1 Article Publish Flow

```
Author          Wiki API        AI Gateway      Points Service    PostgreSQL
  │                │                │                 │                │
  │ POST /posts    │                │                 │                │
  │───────────────>│ save           │                 │                │
  │                │──────────────────────────────────────────────────>│
  │ POST /ai/assist│                │                 │                │
  │───────────────>│ assist request │                 │                │
  │                │───────────────>│                 │                │
  │                │<───────────────│ summary,tags    │                │
  │ POST transition│                │                 │                │
  │  (submit)      │                │                 │                │
  │───────────────>│ REVIEW state   │                 │                │
  │                │                │                 │                │
  │ POST transition│                │                 │                │
  │  (publish)     │                │                 │                │
  │───────────────>│ PUBLISHED      │                 │                │
  │                │ Webhook        │                 │                │
  │                │───────────────────────────────>│ POST_CREATE      │
  │                │                │                 │ award_points     │
  │                │                │                 │───────────────>│
  │                │<───────────────────────────────│ 200 OK           │
```

## 4.2 RAG Q&A Flow (Platform)

```
User            Wiki/RAG API    Embedding       pgvector        Claude API
  │                │                │               │                │
  │ question input │                │               │                │
  │───────────────>│ vectorize      │               │                │
  │                │───────────────>│               │                │
  │                │<───────────────│ embedding     │                │
  │                │ similar search │               │                │
  │                │───────────────────────────────>│                │
  │                │<───────────────────────────────│ top-k context  │
  │                │ RAG prompt                                    │
  │                │──────────────────────────────────────────────>│
  │                │<──────────────────────────────────────────────│
  │<───────────────│ answer + citations                            │
```

:::info Phase 2 onward
The RAG flow is fully introduced in Phase 2 (Platformization). Phases 0–1 prioritize full-text search + AI assist.
:::
