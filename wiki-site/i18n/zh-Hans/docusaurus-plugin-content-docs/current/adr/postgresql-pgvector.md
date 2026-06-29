---
sidebar_position: 4
---

# ADR-003：采用 PostgreSQL + pgvector

| 项目 | 内容 |
| --- | --- |
| **背景** | 希望将来在同一基盘上处理业务数据与向量搜索。不想分散运维。 |
| **决定** | 采用 PostgreSQL，Vector DB 不以专用产品而通过 pgvector 扩展集成。 |
| **状态** | 采纳 (Accepted) |
| **影响** | 单一 DB 管理业务+向量。运维·备份·权限一元化（ISMS 一致）。 |
| **替代方案** | 专用 Vector DB（Pinecone 等：运维增加·数据主权顾虑） |

## 扩展方针

- 通过读副本分离搜索/统计负载
- pgvector 以 IVFFlat / HNSW 索引优化近邻探索
