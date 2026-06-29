---
sidebar_position: 1
---

# Platform Vision

## Wiki Is the Entry Point; Platform Is the Goal

Build an **enterprise-wide AI knowledge foundation** that vectorizes and relates organizational tacit knowledge for reuse through RAG and agents. Redefine Wiki not as a standalone system, but as the **first application** on the platform.

## Perspective Shift

| Perspective | Wiki System (legacy) | AI Knowledge Platform (V1.1) |
| --- | --- | --- |
| Scope | Posts, search, evaluation, points | Knowledge foundation + shared base for multi-AI applications |
| Wiki's role | The entire system | Module 1 (first plugin) |
| Knowledge handling | Article storage | Embedding + Vector + Knowledge Graph |
| AI's role | Assist (summary/tags) | RAG · Agent Memory · Workflow |
| Extension | Add Wiki features | Sales daily report AI / hiring evaluation AI / COBOL migration AI, etc. connect to the same foundation |
| Destination | Internal Wiki | **YFC AI Platform** (unified foundation for all in-house AI) |

## V1.0 Review Closure

V1.0 received an external review score of **96/100 (A+)**. V1.1 delivers engineering of eight items and platformization toward 100 points (YFC AI development standard template).

| V1.0 finding | V1.1 response | Section |
| --- | --- | --- |
| Missing ADR | ADR-001–006 | [ADR](../adr/overview) |
| NFR TPS quantification | Login 200 / Search 100 / Post 50 / AI 20 concurrent | [Performance Requirements](../design/nfr-performance) |
| Threat Model | STRIDE + countermeasures | [Security](../design/stride-security) |
| Sequence Diagram | Article publish / RAG Q&A | [Sequences](../design/sequences) |
| CI/CD | Pipeline + security gates | [DevSecOps](../devops/cicd-devsecops) |
| Coding Standard | Naming/folder/DDD/Clean Arch | [Coding Standard](../devops/coding-standard) |
| Test Strategy | Unit/Integration/E2E/Security/Perf/Prompt | [Test Strategy](../devops/test-strategy) |
| Prompt Catalog | Generation templates + AI Coding Guide | [Prompt Catalog](../devops/ai-prompt-catalog) |
| **Platformization** | Wiki → AI Knowledge Platform | Chapters 1–2 of this document |
