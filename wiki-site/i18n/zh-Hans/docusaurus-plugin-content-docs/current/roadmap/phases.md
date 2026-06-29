---
sidebar_position: 1
---

# 演进路线图

在 Wiki 上确立基盘与运维，后续 AI 项目向同一基盘插件化，发展为 **YFC AI Platform**。

| 阶段 | 主题 | 内容 | 工数 |
| --- | --- | --- | --- |
| **Phase 0** | Wiki PoC | SSO + 投稿 + 搜索 + 点赞 + 基础积分 | 约 3.0 人月 |
| **Phase 1** | Wiki 生产 | 评价/采纳/搜索/仪表盘/AI 辅助 | 约 3.0 人月 |
| **Phase 2** | Platform 化 | Embedding / Vector (pgvector) / RAG / 语义搜索 | 约 4.0 人月 |
| **Phase 3** | Agent 化 | Agent Memory / Workflow / Prompt Library | 约 4.0 人月 |
| **Phase 4** | 多应用展开 | 营业日报 AI / 招聘评估 AI / COBOL 迁移 AI 插件化，MCP 集成 | 按项目 |

## Phase 0 — Wiki PoC

- Entra ID SSO 联动
- 基本投稿·Markdown 编辑
- 全文搜索
- 点赞 + `POST_CREATE` 基础评分

## Phase 1 — Wiki 生产

- 多轴评价·最佳答案采纳
- 个人/全公司仪表盘
- AI 辅助（摘要/标签/重复）
- 知识缺口可视化

## Phase 2 — Platform 化

- Embedding + pgvector 引入
- 语义搜索（RAG 基盘）
- Knowledge Graph 启动

## Phase 3 — Agent 化

- Agent Memory
- Workflow Engine
- Prompt Library 正式运维

## Phase 4 — 多应用展开

- MCP Gateway 集成
- 营业日报 AI / 招聘评估 AI / COBOL 迁移 AI

各项目向 Platform Core 插件化，共享知识基盘。
