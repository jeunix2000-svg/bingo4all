# YFC AI Knowledge Platform

全社AI内製の共通基盤。**社内Wikiは最初の1モジュール（Module 1）**であり、後続のAI案件
（営業日報AI・採用評価AI・COBOL移行AI 等）は同じ `platform-core` 能力にプラグインする。

設計根拠: 別添「YFC AI Knowledge Platform エンタープライズ設計書 V1.1」（および V1.0）。
Claude Code 等での開発指針は **[CLAUDE.md](./CLAUDE.md)** を参照。

## 構成
| パッケージ | 役割 | 状態 |
|---|---|---|
| `packages/platform-core` | Embedding/VectorStore/RagEngine/PromptLibrary/McpGateway（能力IF） | IF定義 |
| `packages/wiki-module` | Wiki（Module 1）posts CRUD・状態遷移・権限 | **実装+HTTP結合テスト済(14件)** |
| `packages/point-service` | 積分マイクロサービス（独自IP） | **実装+テスト済** |
| `db/migrations` | Flyway（V1 core / V2 points / V3 pgvector） | **PG検証済** |
| `openapi/` | API真実源（OpenAPI 3.0・検証済） | 確定 |

## クイックスタート
```bash
npm install
npm --workspace @yfc/point-service test       # ドメイン・ユニットテスト（13件 緑）
docker compose up -d db
npm run db:migrate                            # Flywayでスキーマ適用
npm run start:points                          # 積分サービス起動 (:8081)
# 採点イベント例（Wiki Webhook相当）
curl -XPOST localhost:8081/api/v1/points/events \
  -H 'content-type: application/json' \
  -d '{"ruleCode":"POST_CREATE","beneficiaryId":"<uuid>","refType":"post","refId":"<uuid>"}'
```

## 検証済みの不変条件
- 自票拒否（DBトリガ `SELF_VOTE_FORBIDDEN` + ドメイン）
- 積分台帳の冪等記帳（UNIQUE(rule, ref_type, ref_id, user)）
- 評価の日次上限・信誉加重（ドメイン・テスト済）
- レビュアー自動昇格の定量条件（信誉≥80 ∧ 90日貢献≥20 ∧ 違反0）

## 次の実装（Claude Codeで継続）
1. `wiki-module`：OpenAPIから残りのController/Service/Repositoryを生成（CLAUDE.md §5）。
2. `platform-core`：pgvector実装でVectorStore/RagEngineを具体化（Phase 2）。
3. CI緑化 → Azureへデプロイ（DevSecOpsゲート通過）。

## 実装済みAPI（wiki-module / posts）
OpenAPIに対応する posts のCRUD・状態遷移を実装し、実HTTPで調通（テスト14件緑）。
| Method | Path | 説明 | 検証 |
|---|---|---|---|
| GET | /api/v1/posts | 一覧・検索・ページング | ○ |
| POST | /api/v1/posts | 作成（AI概要自動補完／機密はAI非送信） | ○ |
| GET | /api/v1/posts/:id | 詳細 | ○ |
| PUT | /api/v1/posts/:id | 更新（作者/権限者のみ） | ○ |
| DELETE | /api/v1/posts/:id | 論理削除→404 | ○ |
| POST | /api/v1/posts/:id/transition | 状態遷移（不正は409／権限制御） | ○ |

```bash
npm --workspace @yfc/wiki-module test     # 14件緑（実HTTP結合テスト）
npm run start:wiki                        # PostgreSQL接続で起動 (:8080)
```
