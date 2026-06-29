---
sidebar_position: 5
---

# ADR-004：LLM に Claude API を採用

| 項目 | 内容 |
| --- | --- |
| **背景** | 要約・分類・重複・RAG・レビューに高品質な日本語 LLM が必要。 |
| **決定** | Claude API を採用し、AI Gateway で Agent 化・機密制御する。 |
| **状態** | 採用 (Accepted) |
| **影響** | 高品質日本語処理。Gateway で機密区分に応じた送信制御が可能。 |
| **代替案** | 他社 LLM（日本語品質/連携/データ取扱いで比較劣後） |

## AI API エンドポイント

| エンドポイント | 用途 |
| --- | --- |
| `POST /ai/assist` | 概要生成・分類・タグ・重複検知・推敲 |
| `POST /ai/review` | AI Reviewer（信頼度スコア・参考資料・重複率） |

:::warning 機密制御
`CONFIDENTIAL` 区分の本文は AI Gateway 経由でも **非送信** を既定とする（STRIDE 整合）。
:::
