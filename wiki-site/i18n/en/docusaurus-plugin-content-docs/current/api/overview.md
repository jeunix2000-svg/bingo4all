---
sidebar_position: 1
---

# Wiki API Overview

REST API specification for the YFC internal Wiki. **OpenAPI 3.0.3** compliant.

## Basic Information

| Item | Value |
| --- | --- |
| Title | YFC Internal Wiki API |
| Version | 1.0.0 |
| Authentication | Entra ID (OIDC) Bearer JWT |
| Production | `https://wiki.yfc.internal/api/v1` |
| Staging | `https://wiki-stg.yfc.internal/api/v1` |

## Specification File

📄 [Download yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml)

Used as the **Single Source of Truth** for Controller/DTO auto-generation with Claude Code and similar tools.

## Tags (Feature Groups)

| Tag | Description |
| --- | --- |
| `posts` | Post CRUD · state transitions |
| `contributions` | Answers · supplements |
| `evaluation` | Upvotes · multi-axis ratings · verification |
| `search` | List · full-text search |
| `stats` | Personal/org statistics · knowledge gap |
| `moderation` | Report queue |
| `ai` | AI assist · AI Reviewer |

Endpoint list: [API Endpoints](./endpoints)
