---
sidebar_position: 4
---

# ADR-003：PostgreSQL + pgvector を採用

| 項目 | 内容 |
| --- | --- |
| **背景** | 業務データとベクトル検索を将来同一基盤で扱いたい。運用を分散させたくない。 |
| **決定** | PostgreSQL を採用し、Vector DB は専用品でなく pgvector 拡張で統合する。 |
| **状態** | 採用 (Accepted) |
| **影響** | 1 つの DB で業務+ベクトルを管理。運用・バックアップ・権限を一元化（ISMS 整合）。 |
| **代替案** | 専用 Vector DB（Pinecone 等：運用増・データ主権懸念） |

## スケール方針

- 読み取りレプリカで検索/統計負荷を分離
- pgvector は IVFFlat / HNSW インデックスで近傍探索を最適化
