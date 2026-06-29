---
sidebar_position: 1
---

# プラットフォーム・ビジョン

## Wiki は入口、Platform が目的

組織の暗黙知をベクトル化・関係化し、RAG とエージェントで再利用する **全社 AI 知識基盤** を構築する。Wiki は単体システムではなく、プラットフォーム上の **第 1 アプリケーション** として再定義する。

## 観点の転換

| 観点 | Wiki System（従来） | AI Knowledge Platform（V1.1） |
| --- | --- | --- |
| 範囲 | 投稿・検索・評価・積分 | 知識基盤＋多 AI 応用の共通土台 |
| Wiki の位置 | システム全体 | Module 1（最初のプラグイン） |
| 知識の扱い | 記事の保管 | Embedding + Vector + Knowledge Graph |
| AI の役割 | 補助（要約/タグ） | RAG・Agent Memory・Workflow |
| 拡張 | Wiki 機能追加 | 営業日報 AI / 採用評価 AI / COBOL 移行 AI 等が同一基盤に接続 |
| 到達点 | 社内 Wiki | **YFC AI Platform**（全 AI 内製の統一基盤） |

## V1.0 レビュー消し込み

V1.0 は外部レビュー **96/100（A+）**。V1.1 は 100 点（YFC AI 開発標準テンプレート）に向けた 8 項目の工程化と Platform 化を実現する。

| V1.0 指摘 | V1.1 対応 | 章 |
| --- | --- | --- |
| ADR 欠如 | ADR-001〜006 | [ADR](../adr/overview) |
| NFR の TPS 量化 | Login 200 / Search 100 / Post 50 / AI 20 同時 | [性能要件](../design/nfr-performance) |
| Threat Model | STRIDE + 対策 | [セキュリティ](../design/stride-security) |
| Sequence Diagram | 記事公開 / RAG 質問応答 | [シーケンス](../design/sequences) |
| CI/CD | パイプライン + セキュリティゲート | [DevSecOps](../devops/cicd-devsecops) |
| Coding Standard | 命名/フォルダ/DDD/Clean Arch | [コーディング規約](../devops/coding-standard) |
| Test Strategy | Unit/Integration/E2E/Security/Perf/Prompt | [テスト戦略](../devops/test-strategy) |
| Prompt Catalog | 生成テンプレート + AI Coding Guide | [Prompt Catalog](../devops/ai-prompt-catalog) |
| **Platform 化** | Wiki → AI Knowledge Platform | 本書 1〜2 章 |
