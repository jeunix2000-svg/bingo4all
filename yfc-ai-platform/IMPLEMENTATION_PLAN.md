# 実施計画（Implementation Plan）— Phase 0

## 目的
V1.1設計を実装に移す。Phase 0（6週）でWikiコア＋積分＋審査を立ち上げ、PoC合否基準（V1.0 §16）で判定。

## スプリント計画（6週 / 1週=1スプリント想定）
| 週 | 主目標 | 主要タスク | 完了の定義 |
|---|---|---|---|
| W1 | 基盤 | リポジトリ/CI/CD・docker-compose・Flyway適用・Entra OIDC疎通 | CI緑・SSOログイン可 |
| W2 | 投稿 | wiki-module: posts CRUD（OpenAPI生成）・機密区分・一覧 | 投稿/閲覧/権限フィルタ |
| W3 | 評価/積分 | vote/rating・Webhook→point-service・自票拒否・日次上限 | 採点が台帳に記帳 |
| W4 | 検索/AI | 全文検索・AI支援(概要/タグ/重複)・AI Reviewer | 検索≤3s・AI結果表示 |
| W5 | 運用 | モデレーション・状態遷移・監査ログ(Audit Catalog) | 審査/削除/復元が監査記録 |
| W6 | 仕上げ | E2E・負荷試験(TPS)・PoC指標計測・受入 | Must全達成で判定会 |

## 役割（RACI 抜粋・V1.0 §14）
- IT基盤推進部: 基盤/CI/CD/積分ルール（R/A）
- レビュアー/モデレータ: 審査・違反対応（R/A）
- 情報セキュリティ委員会: 監査・機密（C）

## ゲート
- 各PR: Claude Review + CodeQL + テスト緑（CLAUDE.md §2,4）。
- 本番反映: 申請制承認・ロールバック手順必須（DevSecOps §7）。

## PoC合否（V1.0 §16）
- Must: 有効投稿≥50 / アクティブ貢献者≥20 / 機密誤公開0
- Want(≥70%): 解決率≥30% / 検索経由≥40% / 再訪≥50%
- 業務KPI: Onboarding−20% / 重複質問−30%（継続モニタ）
