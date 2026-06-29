---
sidebar_position: 2
---

# 平台架构

## 层级结构

```
┌─────────────────────────────────────────────────────┐
│  AI Applications（营业日报AI / 招聘评估AI / COBOL迁移AI …） │
├─────────────────────────────────────────────────────┤
│  Wiki Module（第1模块）— 投稿·评价·搜索·仪表盘   │
├─────────────────────────────────────────────────────┤
│  Platform Core                                      │
│  Knowledge Graph │ Embedding │ Vector DB │ RAG Engine │
│  Agent Memory    │ Workflow  │ Prompt Library │ MCP  │
├─────────────────────────────────────────────────────┤
│  Infrastructure — PostgreSQL+pgvector / Entra ID / Azure │
└─────────────────────────────────────────────────────┘
```

## 平台能力（8 组件）

| 能力 | 角色 | 技术（预期） | 引入阶段 |
| --- | --- | --- | --- |
| **Knowledge Graph** | 结构化知识·人员·领域关系 | PostgreSQL / 图扩展 | Phase 2 |
| **Embedding** | 正文·问题向量化 | Claude / 嵌入模型 | Phase 2 |
| **Vector DB** | 相似搜索·近邻探索 | PostgreSQL + pgvector | Phase 2 |
| **RAG Engine** | 带上下文回答生成 | Claude + 搜索 | Phase 2-3 |
| **Agent Memory** | 对话·使用上下文记忆 | DB + 会话 | Phase 3 |
| **Workflow Engine** | 业务流程编排 | 内制 / OSS | Phase 3 |
| **Prompt Library** | 提示词资产统一管理 | 仓库管理 | Phase 1- |
| **MCP Gateway** | 外部工具/数据连接 | MCP | Phase 3-4 |

## 主要服务

| 服务 | 角色 | 技术 |
| --- | --- | --- |
| Wiki 本体 | 投稿·搜索·权限·Markdown | Wiki.js（OSS） |
| Points Service | 评分·台账·排行榜 | Node/Express + PostgreSQL |
| AI Gateway | LLM 调用·机密控制 | Claude API + Gateway |

认证采用 **Entra ID (OIDC)** 的 Bearer 令牌。Wiki API 基础 URL：

- 生产: `https://wiki.yfc.internal/api/v1`
- 验证: `https://wiki-stg.yfc.internal/api/v1`

详见 [Wiki 模块](./wiki-module) 与 [ADR](../adr/overview)。
