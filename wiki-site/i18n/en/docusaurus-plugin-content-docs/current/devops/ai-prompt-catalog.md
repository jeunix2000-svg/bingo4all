---
sidebar_position: 4
---

# AI Development Standards · Prompt Catalog

Catalog generation prompts to keep Claude Code output at a consistent quality level.

Each prompt assumes **this design document (C4/OpenAPI/table definitions/standards) is provided as context**.

## Prompt Catalog

| Prompt | Purpose | Primary Input Context |
| --- | --- | --- |
| **Generate API (Controller)** | Generate Controller/routes from OpenAPI | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) + [Coding Standard](./coding-standard) |
| **Generate DTO** | Generate DTO/types from schemas | OpenAPI schemas |
| **Generate React (UI)** | Generate screens from wireframes | V1.0 UI Mockup + design standards |
| **Generate SQL/Migration** | Generate DDL/Flyway from table definitions | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| **Generate Test** | Generate tests from acceptance criteria | User stories + [Test Strategy](./test-strategy) |
| **Generate Agent Prompt** | Library-ize prompts for each Agent | AI Coding Guide |

## AI Coding Guide (Principles)

1. **Always provide this design document as context** and enforce standards (naming/layer separation/error codes/logging).
2. Put generated artifacts in PRs and pass **Claude Review + human review** double-check.
3. Version prompts in Prompt Library and regression-test with AI Prompt Test.
4. **Do not include confidential data in the prompt** (aligned with STRIDE/Gateway control).

## AI API Feature Mapping

| feature (AiAssistRequest) | Description |
| --- | --- |
| `SUMMARY` | Summary generation |
| `CLASSIFY` | Category classification |
| `TAG` | Tag suggestions |
| `DEDUP` | Duplicate detection |
| `POLISH` | Polish |

AiReviewResult: `credibilityScore` (0-100), `recommendedReferences[]`, `duplicateOf[]`, `relatedKnowledge[]`
