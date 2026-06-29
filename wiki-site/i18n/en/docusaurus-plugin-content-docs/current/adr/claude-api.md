---
sidebar_position: 5
---

# ADR-004: Adopt Claude API as LLM

| Item | Description |
| --- | --- |
| **Context** | High-quality Japanese LLM is required for summarization, classification, deduplication, RAG, and review. |
| **Decision** | Adopt Claude API and agentize with confidentiality control via AI Gateway. |
| **Status** | Accepted |
| **Consequences** | High-quality Japanese processing. AI Gateway enables transmission control by confidentiality level. |
| **Alternatives** | Other LLMs (inferior on Japanese quality, integration, and data handling) |

## AI API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /ai/assist` | Summary generation, classification, tags, duplicate detection, polish |
| `POST /ai/review` | AI Reviewer (credibility score, references, duplicate rate) |

:::warning Confidentiality control
Body text classified as `CONFIDENTIAL` is **not transmitted** by default, even via AI Gateway (STRIDE alignment).
:::
