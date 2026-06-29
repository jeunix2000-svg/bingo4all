---
sidebar_position: 1
slug: /intro
---

# YFC AI Knowledge Platform

基于 **YFC AI Knowledge Platform 企业设计书 V1.1** 的内部知识库设计文档。

Wiki 是「入口」而非「目的」。本质在于将组织的隐性知识向量化、关系化，并通过检索增强生成（RAG）与 Agent 实现复用的 **全公司 AI 知识基盘** 构建。

## 定位

| 项目 | 内容 |
| --- | --- |
| 文档编号 | IT-DSGN-2026-0xx |
| 版本 | V1.1 / 标准模板·平台化版 |
| 主语 | Wiki System → **AI Knowledge Platform** |
| Wiki 的位置 | 平台上的 **第 1 模块** |

## 附件规格

| 文件 | 内容 |
| --- | --- |
| [设计书 V1.1 (docx)](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx) | 企业设计书正文 |
| [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) | Wiki REST API 规格 |
| [yfc_points_service.sql](/spec/yfc_points_service.sql) | 积分微服务 DDL |

## 快速导航

1. [平台愿景](./platform/vision) — 从 Wiki 到 Platform 的转型
2. [架构](./platform/architecture) — 8 大能力组件
3. [ADR](./adr/overview) — 架构决策记录
4. [Wiki API](./api/overview) — OpenAPI 概要
5. [积分服务](./data/points-service) — 评分·台账·防刷分
6. [CI/CD·DevSecOps](./devops/cicd-devsecops) — 流水线与门禁
7. [演进路线图](./roadmap/phases) — Phase 0〜4

:::info 关于本站
本站为基于 Docusaurus 构建的 **设计与开发标准公开站点**。  
实现时请以 OpenAPI / SQL / 本设计书作为 Claude Code 等自动生成的基准进行参考。
:::
