---
sidebar_position: 1
slug: /intro
---

# YFC AI Knowledge Platform

Design documentation for the internal knowledge foundation, based on the **YFC AI Knowledge Platform Enterprise Design Document V1.1**.

Wiki is the "entry point," not the goal. The essence is building an **enterprise-wide AI knowledge foundation** that vectorizes and relates organizational tacit knowledge for reuse through retrieval-augmented generation (RAG) and agents.

## Positioning

| Item | Description |
| --- | --- |
| Document ID | IT-DSGN-2026-0xx |
| Version | V1.1 / Standard Template · Platform Edition |
| Subject | Wiki System → **AI Knowledge Platform** |
| Wiki's role | **First module** on the platform |

## Attachments

| File | Description |
| --- | --- |
| [Design Document V1.1 (docx)](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx) | Enterprise design document (main body) |
| [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) | Wiki REST API specification |
| [yfc_points_service.sql](/spec/yfc_points_service.sql) | Points microservice DDL |

## Quick Navigation

1. [Platform Vision](./platform/vision) — Transition from Wiki to Platform
2. [Architecture](./platform/architecture) — Eight core capability components
3. [ADR](./adr/overview) — Architecture Decision Records
4. [Wiki API](./api/overview) — OpenAPI overview
5. [Points Service](./data/points-service) — Scoring, ledger, anti-gaming
6. [CI/CD · DevSecOps](./devops/cicd-devsecops) — Pipeline and gates
7. [Evolution Roadmap](./roadmap/phases) — Phase 0–4

:::info About this site
This Wiki is a **public design and development standards site** built with Docusaurus.  
For implementation, use OpenAPI / SQL / this design document as the baseline for automated generation with Claude Code and similar tools.
:::
