---
sidebar_position: 2
---

# コーディング規約

Claude Code 等の生成出力を統一するための規約。**全 AI 内製案件で共通適用**。

| 項目 | 規約 |
| --- | --- |
| **命名 (Naming)** | 変数/関数 = camelCase、型/クラス = PascalCase、定数 = UPPER_SNAKE、DB = snake_case、API = ケバブ/複数形 (`/posts`) |
| **フォルダ (Folder)** | 機能単位 (feature-based)。例: `/modules/posts/{controller,service,repository,dto,test}` |
| **アーキ (DDD/Clean)** | 層分離: Controller → UseCase(Service) → Domain → Repository。依存は内向き |
| **エラーコード** | `{DOMAIN}_{REASON}` 形式（例: `SELF_VOTE_FORBIDDEN`）。HTTP = 400/401/403/404/409/500 |
| **ログ (Log Rule)** | 構造化 JSON。必須: `ts`/`level`/`trace_id`/`actor_id`/`event`。個人情報/機密はマスキング |
| **コミット/PR** | Conventional Commits（feat/fix/docs…）。PR はテンプレ + Claude Review 必須 |

## エラー応答例

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "自己の投稿には投票できません",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 層分離の原則

```
Controller  ── HTTP 入出力、バリデーション
    ↓
Service     ── ユースケース、トランザクション境界
    ↓
Domain      ── ビジネスルール（外部非依存）
    ↓
Repository  ── DB/API アクセス
```

ドメイン層はフレームワーク・DB に依存しない。
