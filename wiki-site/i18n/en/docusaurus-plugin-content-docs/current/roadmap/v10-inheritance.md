---
sidebar_position: 2
---

# Inheritance from V1.0

This V1.1 does not reject V1.0; it defines the **upper layer (platform + development standards)** on top of it.

## Finalized in V1.0 (Assumptions)

| Item | Content |
| --- | --- |
| C4 Architecture | Context/container/component diagrams |
| OpenAPI | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) |
| DB table definitions | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| UI Mockup | V1.0 Chapter 5 |
| AI Agent | AI assist / AI Reviewer |
| RBAC / RACI | Permission design |
| PoC pass/fail criteria | Acceptance conditions |
| Audit Catalog | Audit log design |

## Additions in V1.1

| Item | Content |
| --- | --- |
| Platform layers | Eight core capability components |
| ADR | ADR-001–006 |
| Sequence | Article publish / RAG Q&A |
| STRIDE | Threat model |
| TPS/P95 | Quantified NFR |
| CI/CD | DevSecOps gates |
| Coding Standard | Naming/layer separation/error codes |
| Test Strategy | Six test types |
| Prompt Catalog | AI development standards |
| Evolution roadmap | Phase 0–4 |

## Revision History

| Version | Score* | Summary of Changes |
| --- | --- | --- |
| V0.1 | 72 | Concept proposal (feature list + approval + points SQL) |
| V0.2 | 90 | Requirements · permissions · data governance · PoC criteria |
| V1.0 | 96 | C4 · OpenAPI · DB details · UI Mockup · AI Agent |
| V1.1 | 98+ | ADR · TPS · STRIDE · Sequence · CI/CD · Coding · Test · Prompt Catalog / Platformization |

* Reference score from external review (ChatGPT).

📄 Design document: [YFC_AI_Knowledge_Platform設計書_V1.1.docx](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx)
