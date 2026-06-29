---
sidebar_position: 4
---

# AI 开发规范·Prompt Catalog

为保持 Claude Code 开发输出的一定质量，将生成提示词目录化。

各提示词以 **将本设计书（C4/OpenAPI/表定义/规范）作为上下文提供** 为前提。

## Prompt Catalog

| Prompt | 用途 | 主要输入上下文 |
| --- | --- | --- |
| **Generate API (Controller)** | 从 OpenAPI 生成 Controller/路由 | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) + [编码规范](./coding-standard) |
| **Generate DTO** | 从 Schema 生成 DTO/类型 | OpenAPI schemas |
| **Generate React (UI)** | 从线框图生成画面 | V1.0 UI Mockup + 设计规范 |
| **Generate SQL/Migration** | 从表定义生成 DDL/Flyway | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| **Generate Test** | 从验收标准生成测试 | 用户故事 + [测试策略](./test-strategy) |
| **Generate Agent Prompt** | 各 Agent 提示词 Library 化 | AI Coding Guide |

## AI Coding Guide（原则）

1. **始终将本设计书作为上下文提供**，遵循规范（命名/层分离/错误码/日志）。
2. 生成物提交 PR，通过 **Claude Review + 人工评审双重检查**。
3. 提示词在 Prompt Library **版本管理**，以 AI Prompt Test 回归验证。
4. **机密数据不包含在提示词中**（与 STRIDE/Gateway 控制一致）。

## AI API 功能映射

| feature (AiAssistRequest) | 说明 |
| --- | --- |
| `SUMMARY` | 概要生成 |
| `CLASSIFY` | 分类 |
| `TAG` | 标签建议 |
| `DEDUP` | 重复检测 |
| `POLISH` | 润色 |

AiReviewResult: `credibilityScore` (0-100), `recommendedReferences[]`, `duplicateOf[]`, `relatedKnowledge[]`
