---
sidebar_position: 2
---

# 自 V1.0 的继承

本 V1.1 并非否定 V1.0，而是规定其 **上层（平台 + 开发标准）**。

## V1.0 已确定（前提）

| 项目 | 内容 |
| --- | --- |
| C4 架构 | 上下文/容器/组件图 |
| OpenAPI | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) |
| DB 表定义 | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| UI Mockup | V1.0 第 5 章 |
| AI Agent | AI 辅助 / AI Reviewer |
| RBAC / RACI | 权限设计 |
| PoC 合格标准 | 验收条件 |
| 审计 Catalog | Audit 日志设计 |

## V1.1 新增

| 项目 | 内容 |
| --- | --- |
| Platform 层级 | 8 大能力组件 |
| ADR | ADR-001〜006 |
| Sequence | 文章发布 / RAG 问答 |
| STRIDE | 威胁模型 |
| TPS/P95 | 量化 NFR |
| CI/CD | DevSecOps 门禁 |
| Coding Standard | 命名/层分离/错误码 |
| Test Strategy | 6 种测试 |
| Prompt Catalog | AI 开发规范 |
| 演进路线图 | Phase 0〜4 |

## 修订历史

| 版本 | 评分* | 变更概要 |
| --- | --- | --- |
| V0.1 | 72 | 概念方案（功能列表+禀议+积分 SQL） |
| V0.2 | 90 | 需求定义·权限·数据治理·PoC 基准 |
| V1.0 | 96 | C4·OpenAPI·DB 详情·UI Mockup·AI Agent |
| V1.1 | 98+ | ADR·TPS·STRIDE·Sequence·CI/CD·Coding·Test·Prompt Catalog / Platform 化 |

* 外部评审（ChatGPT）参考评分。

📄 设计书正文: [YFC_AI_Knowledge_Platform設計書_V1.1.docx](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx)
