---
sidebar_position: 4
---

# AI 開発規範・Prompt Catalog

Claude Code 開発の出力を一定品質に保つため、生成プロンプトをカタログ化する。

各プロンプトは **本設計書（C4/OpenAPI/テーブル定義/規約）を文脈として与える** 前提。

## Prompt Catalog

| Prompt | 用途 | 主な入力文脈 |
| --- | --- | --- |
| **Generate API (Controller)** | OpenAPI から Controller/ルート生成 | [yfc_wiki_openapi.yaml](/spec/yfc_wiki_openapi.yaml) + [コーディング規約](./coding-standard) |
| **Generate DTO** | スキーマから DTO/型生成 | OpenAPI schemas |
| **Generate React (UI)** | ワイヤーフレームから画面生成 | V1.0 UI Mockup + デザイン規約 |
| **Generate SQL/Migration** | テーブル定義から DDL/Flyway 生成 | [yfc_points_service.sql](/spec/yfc_points_service.sql) |
| **Generate Test** | 受入基準からテスト生成 | ユーザーストーリー + [テスト戦略](./test-strategy) |
| **Generate Agent Prompt** | 各 Agent のプロンプトを Library 化 | AI Coding Guide |

## AI Coding Guide（原則）

1. **常に本設計書を文脈として与え**、規約（命名/層分離/エラーコード/ログ）に従わせる。
2. 生成物は PR に乗せ、**Claude Review + 人手レビューの二重チェック** を通す。
3. プロンプトは Prompt Library で **バージョン管理** し、AI Prompt Test で回帰検証。
4. **機密データはプロンプトに含めない**（STRIDE/Gateway 制御と整合）。

## AI API 機能マッピング

| feature (AiAssistRequest) | 説明 |
| --- | --- |
| `SUMMARY` | 概要生成 |
| `CLASSIFY` | カテゴリ分類 |
| `TAG` | タグ提案 |
| `DEDUP` | 重複検知 |
| `POLISH` | 推敲 |

AiReviewResult: `credibilityScore` (0-100), `recommendedReferences[]`, `duplicateOf[]`, `relatedKnowledge[]`
