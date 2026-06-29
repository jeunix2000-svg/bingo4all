---
sidebar_position: 1
---

# Wiki API 概要

YFC 社内 Wiki の REST API 仕様。**OpenAPI 3.0.3** 準拠。

## 基本情報

| 項目 | 値 |
| --- | --- |
| タイトル | YFC 社内 Wiki API |
| バージョン | 1.0.0 |
| 認証 | Entra ID (OIDC) Bearer JWT |
| 本番 | `https://wiki.yfc.internal/api/v1` |
| 検証 | `https://wiki-stg.yfc.internal/api/v1` |

## 仕様ファイル

📄 [yfc_wiki_openapi.yaml をダウンロード](/spec/yfc_wiki_openapi.yaml)

Claude Code 等による Controller/DTO 自動生成の **Single Source of Truth** として使用する。

## タグ（機能グループ）

| タグ | 説明 |
| --- | --- |
| `posts` | 投稿 CRUD・状態遷移 |
| `contributions` | 回答・補足 |
| `evaluation` | いいね・多軸評価・検証 |
| `search` | 一覧・全文検索 |
| `stats` | 個人/全社統計・ナレッジギャップ |
| `moderation` | 通報キュー |
| `ai` | AI 支援・AI Reviewer |

詳細エンドポイント一覧: [API エンドポイント](./endpoints)
