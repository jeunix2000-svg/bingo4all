---
sidebar_position: 1
---

# CI/CD・DevSecOps

セキュリティを後付けせず各段階に組み込む（Shift-Left）。

## パイプライン段階

| 段階 | 内容 | ゲート/成果物 |
| --- | --- | --- |
| **Source** | GitHub・ブランチ保護 | 直 push 禁止・PR 必須 |
| **Pull Request** | Claude Review 自動レビュー | 規約/設計整合/脆弱パターン指摘 |
| **Build/Test** | GitHub Actions | Unit/Integration・カバレッジ ≥ 80% |
| **Security** | SAST/依存/シークレット/IaC | CodeQL・脆弱性ゼロで通過 |
| **Deploy** | Azure（検証→本番） | 本番は申請制承認 |
| **Monitor** | Azure Monitor/SIEM | Audit 連携・アラート |

## 本リポジトリのデプロイ

ポータル + Wiki の静的デプロイは GitHub Actions で Apache へ rsync：

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main, master]
    paths: ['**.html', '**.js', 'wiki-site/**', ...]
steps:
  - bash scripts/build-wiki.sh
  - rsync → Apache /var/www/html/
```

Wiki 設計書・OpenAPI・SQL の更新も `wiki-site/**` 変更で再ビルドされる。

## 環境分離

- 開発 / 検証 / 本番を分離
- 本番反映はロールバック手順を前提
- DB アカウント分離（STRIDE: Elevation of Privilege 対策）

[デプロイ手順](../dev/deploy) を参照。
