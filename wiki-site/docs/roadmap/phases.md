---
sidebar_position: 1
---

# 進化ロードマップ

Wiki で基盤と運用を確立し、同一基盤に後続 AI 案件をプラグインして **YFC AI Platform** へ発展させる。

| フェーズ | 主題 | 内容 | 工数 |
| --- | --- | --- | --- |
| **Phase 0** | Wiki PoC | SSO + 投稿 + 検索 + いいね + 基礎積分 | 約 3.0 人月 |
| **Phase 1** | Wiki 本番 | 評価/採択/検索/ダッシュボード/AI 支援 | 約 3.0 人月 |
| **Phase 2** | Platform 化 | Embedding / Vector (pgvector) / RAG / 意味検索 | 約 4.0 人月 |
| **Phase 3** | Agent 化 | Agent Memory / Workflow / Prompt Library | 約 4.0 人月 |
| **Phase 4** | 多アプリ展開 | 営業日報 AI / 採用評価 AI / COBOL 移行 AI をプラグイン、MCP 統合 | 案件別 |

## Phase 0 — Wiki PoC

- Entra ID SSO 連携
- 基本投稿・Markdown 編集
- 全文検索
- いいね + `POST_CREATE` 基礎採点

## Phase 1 — Wiki 本番

- 多軸評価・ベストアンサー採択
- 個人/全社ダッシュボード
- AI 支援（要約/タグ/重複）
- ナレッジ・ギャップ可視化

## Phase 2 — Platform 化

- Embedding + pgvector 導入
- 意味検索（RAG 基盤）
- Knowledge Graph 着手

## Phase 3 — Agent 化

- Agent Memory
- Workflow Engine
- Prompt Library 本格運用

## Phase 4 — 多アプリ展開

- MCP Gateway 統合
- 営業日報 AI / 採用評価 AI / COBOL 移行 AI

各案件は Platform Core にプラグインし、知識基盤を共有する。
