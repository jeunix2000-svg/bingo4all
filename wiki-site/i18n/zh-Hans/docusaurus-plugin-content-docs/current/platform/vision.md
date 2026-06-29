---
sidebar_position: 1
---

# 平台愿景

## Wiki 是入口，Platform 是目的

将组织的隐性知识向量化、关系化，并通过 RAG 与 Agent 实现复用，构建 **全公司 AI 知识基盘**。Wiki 并非独立系统，而是作为平台上的 **第 1 应用** 重新定义。

## 视角转变

| 视角 | Wiki System（传统） | AI Knowledge Platform（V1.1） |
| --- | --- | --- |
| 范围 | 投稿·搜索·评价·积分 | 知识基盘 + 多 AI 应用的共通底座 |
| Wiki 的位置 | 系统整体 | Module 1（首个插件） |
| 知识的处理 | 文章保管 | Embedding + Vector + Knowledge Graph |
| AI 的角色 | 辅助（摘要/标签） | RAG·Agent Memory·Workflow |
| 扩展 | Wiki 功能追加 | 营业日报 AI / 招聘评估 AI / COBOL 迁移 AI 等接入同一基盘 |
| 终点 | 内部 Wiki | **YFC AI Platform**（全 AI 内制的统一基盘） |

## V1.0 评审消项

V1.0 外部评审 **96/100（A+）**。V1.1 面向 100 分（YFC AI 开发标准模板），实现 8 项工程化与 Platform 化。

| V1.0 指摘 | V1.1 对应 | 章节 |
| --- | --- | --- |
| ADR 缺失 | ADR-001〜006 | [ADR](../adr/overview) |
| NFR 的 TPS 量化 | Login 200 / Search 100 / Post 50 / AI 20 并发 | [性能需求](../design/nfr-performance) |
| Threat Model | STRIDE + 对策 | [安全](../design/stride-security) |
| Sequence Diagram | 文章发布 / RAG 问答 | [时序](../design/sequences) |
| CI/CD | 流水线 + 安全门禁 | [DevSecOps](../devops/cicd-devsecops) |
| Coding Standard | 命名/文件夹/DDD/Clean Arch | [编码规范](../devops/coding-standard) |
| Test Strategy | Unit/Integration/E2E/Security/Perf/Prompt | [测试策略](../devops/test-strategy) |
| Prompt Catalog | 生成模板 + AI Coding Guide | [Prompt Catalog](../devops/ai-prompt-catalog) |
| **Platform 化** | Wiki → AI Knowledge Platform | 本书 1〜2 章 |
