---
sidebar_position: 3
---

# Wiki モジュール

Wiki はプラットフォーム上の **第 1 モジュール**。V1.0 で確定した機能を Platform 能力と対応付ける。

## Wiki 機能 ↔ Platform 能力

| Wiki 機能（V1.0） | 活用する Platform 能力 |
| --- | --- |
| 全文検索 | Vector DB / Embedding（意味検索へ進化） |
| AI Reviewer / 重複検知 | Embedding + Knowledge Graph |
| AI 支援（要約/タグ） | Prompt Library + Knowledge Agent |
| 疑問解決 | RAG Engine（社内 QA） |
| 将来 Auto FAQ | RAG + Workflow Engine |

## 投稿タイプ

| PostType | 説明 |
| --- | --- |
| `SHARE` | 経験共有 |
| `QUESTION` | 疑問提起 |
| `REVIEW_ITEM` | 検討事項 |
| `HOWTO` | 手順書 |
| `POSTMORTEM` | 失敗事例 |
| `BEST_PRACTICE` | ベストプラクティス |

## 投稿ライフサイクル

```
DRAFT → SUBMITTED → REVIEW → APPROVED → PUBLISHED → ARCHIVED
                                              ↓
                                          DELETED（論理削除）
```

状態遷移 API: `POST /posts/{id}/transition`  
アクション: `submit` / `approve` / `publish` / `archive` / `restore`

## 機密区分

| Confidentiality | 説明 |
| --- | --- |
| `PUBLIC` | 全社公開 |
| `INTERNAL` | 社内限定 |
| `DEPT` | 部門限定 |
| `CONFIDENTIAL` | 機密（AI 非送信・厳格 RBAC） |

## 評価・貢献

- **投票**: いいね (+1) / 低評価 (-1)。自票は禁止（`SELF_VOTE_FORBIDDEN`）
- **多軸評価**: 実用性・正確性・新規性（各 1〜5）
- **検証済みマーク**: レビュアー以上が付与
- **貢献**: 回答 (`ANSWER`) / 補足 (`SUPPLEMENT`)、ベストアンサー採択

## 統計・運用

| API | 用途 |
| --- | --- |
| `GET /stats/me` | 個人ダッシュボード |
| `GET /stats/org` | 全社統計 |
| `GET /stats/knowledge-gap` | ナレッジ・ギャップ（未解決の多い領域） |
| `GET /moderation/reports` | 通報キュー |

API 詳細は [Wiki API 概要](../api/overview) を参照。
