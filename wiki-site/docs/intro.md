---
sidebar_position: 1
slug: /intro
---

# YFC AI Knowledge Platform

**YFC AI Knowledge Platform エンタープライズ設計書 V1.1** に基づく社内ナレッジ基盤の設計ドキュメントです。

Wiki は「入口」であって「目的」ではない。本質は、組織の暗黙知をベクトル化・関係化し、検索拡張生成（RAG）とエージェントで再利用する **全社 AI 知識基盤** の構築にあります。

## 位置づけ

| 項目 | 内容 |
| --- | --- |
| 文書番号 | IT-DSGN-2026-0xx |
| 版数 | V1.1 / 標準テンプレート・プラットフォーム化版 |
| 主語 | Wiki System → **AI Knowledge Platform** |
| Wiki の位置 | プラットフォーム上の **第 1 モジュール** |

## 別添仕様

| ファイル | 内容 |
| --- | --- |
| [設計書 V1.1 (docx)](/spec/YFC_AI_Knowledge_Platform設計書_V1.1.docx) | エンタープライズ設計書本体 |
| [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) | Wiki REST API 仕様 |
| [yfc_points_service.sql](/spec/yfc_points_service.sql) | ポイント・マイクロサービス DDL |

## クイックナビ

1. [プラットフォーム・ビジョン](./platform/vision) — Wiki から Platform への転換
2. [アーキテクチャ](./platform/architecture) — 8 大能力コンポーネント
3. [ADR](./adr/overview) — アーキテクチャ決定記録
4. [Wiki API](./api/overview) — OpenAPI 概要
5. [ポイントサービス](./data/points-service) — 採点・台帳・防刷分
6. [CI/CD・DevSecOps](./devops/cicd-devsecops) — パイプラインとゲート
7. [進化ロードマップ](./roadmap/phases) — Phase 0〜4

:::info 本サイトについて
本 Wiki は Docusaurus で構築された **設計・開発標準の公開サイト** です。  
実装は Claude Code 等による自動生成の基準として OpenAPI / SQL / 本設計書を参照してください。
:::
