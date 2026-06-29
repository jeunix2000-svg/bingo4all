---
sidebar_position: 2
---

# V1.0 からの継承

本 V1.1 は V1.0 を否定せず、その **上位レイヤ（プラットフォーム + 開発標準）** を規定する。

## V1.0 で確定済（前提）

| 項目 | 内容 |
| --- | --- |
| C4 アーキテクチャ | コンテキスト/コンテナ/コンポーネント図 |
| OpenAPI | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) |
| DB テーブル定義 | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| UI Mockup | V1.0 第 5 章 |
| AI Agent | AI 支援 / AI Reviewer |
| RBAC / RACI | 権限設計 |
| PoC 合否基準 | 受入条件 |
| 監査 Catalog | Audit ログ設計 |

## V1.1 の追加

| 項目 | 内容 |
| --- | --- |
| Platform 階層 | 8 大能力コンポーネント |
| ADR | ADR-001〜006 |
| Sequence | 記事公開 / RAG 質問応答 |
| STRIDE | 脅威モデル |
| TPS/P95 | 定量化 NFR |
| CI/CD | DevSecOps ゲート |
| Coding Standard | 命名/層分離/エラーコード |
| Test Strategy | 6 種テスト |
| Prompt Catalog | AI 開発規範 |
| 進化ロードマップ | Phase 0〜4 |

## 改訂履歴

| 版数 | 評点* | 変更概要 |
| --- | --- | --- |
| V0.1 | 72 | 概念方案（機能リスト＋稟議＋積分 SQL） |
| V0.2 | 90 | 要件定義・権限・データ治理・PoC 基準 |
| V1.0 | 96 | C4・OpenAPI・DB 詳細・UI Mockup・AI Agent |
| V1.1 | 98+ | ADR・TPS・STRIDE・Sequence・CI/CD・Coding・Test・Prompt Catalog / Platform 化 |

* 外部レビュー（ChatGPT）による参考評点。

📄 設計書本体: [YFC_AI_Knowledge_Platform設計書_V1.1.docx](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx)
