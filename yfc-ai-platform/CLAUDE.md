# CLAUDE.md — YFC AI Knowledge Platform 開発ガイド

> このファイルは Claude Code / Codex / Copilot Agent が**一貫した実装**を生成するための単一の指針です。
> 設計の根拠は別添「YFC AI Knowledge Platform エンタープライズ設計書 V1.1」および V1.0 を参照。

## 0. 何を作っているか
**AI Knowledge Platform**（全社AI内製の共通基盤）。社内Wikiはその上に載る **最初の1モジュール (Module 1)**。
後続案件（営業日報AI／採用評価AI／COBOL移行AI）は同じ `platform-core` 能力にプラグインする。

```
packages/
  platform-core/   … Embedding / VectorStore / RagEngine / PromptLibrary / McpGateway（能力IF）
  wiki-module/     … Wiki（Module 1）。Clean Architecture (controller→service→domain→repository)
  point-service/   … 独自IPの積分マイクロサービス（採点・自票拒否・日次上限・信誉加重）※実装+テスト済
db/migrations/     … Flyway (V1 core, V2 points, V3 pgvector)
openapi/           … yfc_wiki_openapi.yaml（API実装の真実源）
```

## 1. アーキテクチャ決定（ADR 抜粋・必ず遵守）
- **ADR-001** Wiki基盤=OSS Wiki.js。独自価値（積分/AI）のみ内製。
- **ADR-002** 積分は独立マイクロサービス（Webhook連携）。Wiki本体に密結合しない。
- **ADR-003** データ=PostgreSQL、Vector=pgvector（専用Vector DBは使わない／運用一元化）。
- **ADR-004** LLM=Claude API。AI Gateway経由でAgent化・機密制御。
- **ADR-005** Wikiは第1モジュール。基盤(platform-core)を共通化し後続案件で再利用。
- **ADR-006** 外部ツール接続はMCPで標準化。

## 2. コーディング規約（Coding Standard）
- **言語**: TypeScript（point-service のドメインは検証済みESM JS。新規はTSで実装）。
- **命名**: 変数/関数=camelCase、型/クラス=PascalCase、定数=UPPER_SNAKE、DB=snake_case、API=複数形ケバブ(`/posts`)。
- **フォルダ**: 機能単位。`modules/<feature>/{controller,service,repository,dto,test}`。
- **層分離 (Clean Architecture)**: `Controller → Service(UseCase) → Domain → Repository`。依存は内向き。ドメインは外部I/Oに非依存。
- **エラーコード**: `{DOMAIN}_{REASON}`（例 `SELF_VOTE_FORBIDDEN`, `POST_NOT_FOUND`, `POST_INVALID_TRANSITION`）。HTTPは 400/401/403/404/409/429/500 に対応。
- **ログ**: 構造化JSON。必須 `ts/level/trace_id/actor_id/event`。個人情報・機密はマスキング。
- **コミット**: Conventional Commits（feat/fix/docs/test/chore）。PRは Claude Review + 人手の二重レビュー必須。

## 3. セキュリティ（STRIDE / 必須）
- 認証は Entra OIDC。資格情報を自社保持しない。
- 機密区分 `CONFIDENTIAL` / `DEPT` の本文は **AIに送信しない**（Gatewayでフィルタ）。
- `point_event` は**追加専用**（UPDATE/DELETE禁止）。自票はDBトリガ＋ドメイン両方で拒否。
- RAGに渡す前に必ず**権限/機密フィルタ**を適用（`VectorQuery.allowedConfidentiality`）。

## 4. テスト方針
- ドメインロジックは必ずユニットテスト（`node --test`、カバレッジ≥80%）。
- API+DBは結合テスト、主要シナリオはE2E(Playwright)、性能はTPS基準(5章)、AI出力はPrompt回帰テスト。

## 5. Prompt Catalog（生成プロンプト・テンプレート）
各プロンプトは本リポジトリ（OpenAPI/テーブル定義/本規約）を**文脈として与える**前提。
| Prompt key | 用途 | 入力文脈 |
|---|---|---|
| `codegen.controller` | OpenAPIからController/route生成 | `openapi/*.yaml` + §2規約 |
| `codegen.dto` | schemaからDTO/型生成 | OpenAPI components.schemas |
| `codegen.react` | ワイヤーフレームから画面生成 | V1.0 §5 Mockup + デザイン規約 |
| `codegen.migration` | テーブル定義からFlyway DDL生成 | V1.0 §8 + `db/migrations` 既存 |
| `codegen.test` | 受入基準からテスト生成 | ユーザーストーリー + §4 |
| `agent.prompt` | 各AgentのプロンプトをLibrary化 | platform-core/promptLibrary |

### 生成時の鉄則
1. 必ず Clean Architecture の層に正しく配置する。
2. エラーは `AppError(code, message, httpStatus)` で投げる（§2 のコード体系）。
3. 機密データをプロンプト/ログに残さない。
4. 生成物はPRに乗せ、`npm test` と CodeQL を通す。

## 6. ローカル実行
```bash
npm install
npm --workspace @yfc/point-service test   # ドメインのユニットテスト（13件）
docker compose up -d db && npm run db:migrate   # PostgreSQL+pgvector & Flyway
npm run start:points                        # 積分サービス :8081
```
