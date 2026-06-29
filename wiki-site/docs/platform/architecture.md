---
sidebar_position: 2
---

# プラットフォーム・アーキテクチャ

## 階層構成

```
┌─────────────────────────────────────────────────────┐
│  AI Applications（営業日報AI / 採用評価AI / COBOL移行AI …） │
├─────────────────────────────────────────────────────┤
│  Wiki Module（第1モジュール）— 投稿・評価・検索・ダッシュボード   │
├─────────────────────────────────────────────────────┤
│  Platform Core                                      │
│  Knowledge Graph │ Embedding │ Vector DB │ RAG Engine │
│  Agent Memory    │ Workflow  │ Prompt Library │ MCP  │
├─────────────────────────────────────────────────────┤
│  Infrastructure — PostgreSQL+pgvector / Entra ID / Azure │
└─────────────────────────────────────────────────────┘
```

## プラットフォーム能力（8 コンポーネント）

| 能力 | 役割 | 技術（想定） | 導入段階 |
| --- | --- | --- | --- |
| **Knowledge Graph** | 知識・人・領域の関係を構造化 | PostgreSQL / グラフ拡張 | Phase 2 |
| **Embedding** | 本文・質問をベクトル化 | Claude / 埋め込みモデル | Phase 2 |
| **Vector DB** | 類似検索・近傍探索 | PostgreSQL + pgvector | Phase 2 |
| **RAG Engine** | 文脈付き回答生成 | Claude + 検索 | Phase 2-3 |
| **Agent Memory** | 会話・利用文脈の記憶 | DB + セッション | Phase 3 |
| **Workflow Engine** | 業務フローのオーケストレーション | 内製 / OSS | Phase 3 |
| **Prompt Library** | プロンプト資産の一元管理 | リポジトリ管理 | Phase 1- |
| **MCP Gateway** | 外部ツール/データ接続 | MCP | Phase 3-4 |

## 主要サービス

| サービス | 役割 | 技術 |
| --- | --- | --- |
| Wiki 本体 | 投稿・検索・権限・Markdown | Wiki.js（OSS） |
| Points Service | 採点・台帳・ランキング | Node/Express + PostgreSQL |
| AI Gateway | LLM 呼び出し・機密制御 | Claude API + Gateway |

認証は **Entra ID (OIDC)** の Bearer トークン。Wiki API ベース URL：

- 本番: `https://wiki.yfc.internal/api/v1`
- 検証: `https://wiki-stg.yfc.internal/api/v1`

詳細は [Wiki モジュール](./wiki-module) と [ADR](../adr/overview) を参照。
