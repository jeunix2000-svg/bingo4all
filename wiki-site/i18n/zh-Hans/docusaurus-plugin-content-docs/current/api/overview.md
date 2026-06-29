---
sidebar_position: 1
---

# Wiki API 概要

YFC 内部 Wiki 的 REST API 规格。**OpenAPI 3.0.3** 合规。

## 基本信息

| 项目 | 值 |
| --- | --- |
| 标题 | YFC 内部 Wiki API |
| 版本 | 1.0.0 |
| 认证 | Entra ID (OIDC) Bearer JWT |
| 生产 | `https://wiki.yfc.internal/api/v1` |
| 验证 | `https://wiki-stg.yfc.internal/api/v1` |

## 规格文件

📄 [下载 yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml)

作为 Claude Code 等生成 Controller/DTO 的 **Single Source of Truth** 使用。

## 标签（功能分组）

| 标签 | 说明 |
| --- | --- |
| `posts` | 投稿 CRUD·状态迁移 |
| `contributions` | 回答·补充 |
| `evaluation` | 点赞·多轴评价·验证 |
| `search` | 列表·全文搜索 |
| `stats` | 个人/全公司统计·知识缺口 |
| `moderation` | 举报队列 |
| `ai` | AI 辅助·AI Reviewer |

详细端点列表: [API 端点](./endpoints)
