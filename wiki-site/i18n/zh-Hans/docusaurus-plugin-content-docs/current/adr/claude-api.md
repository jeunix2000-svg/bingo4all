---
sidebar_position: 5
---

# ADR-004：LLM 采用 Claude API

| 项目 | 内容 |
| --- | --- |
| **背景** | 摘要·分类·重复·RAG·Review 需要高质量日语 LLM。 |
| **决定** | 采用 Claude API，通过 AI Gateway 实现 Agent 化·机密控制。 |
| **状态** | 采纳 (Accepted) |
| **影响** | 高质量日语处理。Gateway 可按机密等级控制发送。 |
| **替代方案** | 其他 LLM（日语质量/集成/数据处理比较劣势） |

## AI API 端点

| 端点 | 用途 |
| --- | --- |
| `POST /ai/assist` | 概要生成·分类·标签·重复检测·润色 |
| `POST /ai/review` | AI Reviewer（置信度分数·参考资料·重复率） |

:::warning 机密控制
`CONFIDENTIAL` 等级的正文即使经 AI Gateway 也 **默认不发送**（与 STRIDE 一致）。
:::
