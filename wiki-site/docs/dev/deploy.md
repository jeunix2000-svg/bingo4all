---
sidebar_position: 2
---

# デプロイ

## 手動デプロイ（WIKI 含む）

```bash
# 1. WIKI をビルド
bash scripts/build-wiki.sh

# 2. ポータル全体を同期
bash deploy.sh
```

## GitHub Actions

`main` / `master` ブランチへの push で自動デプロイされます。  
HTML / JS の変更に加え、`wiki-site/**` の変更時も WIKI をビルドして `/wiki/` へ配置します。

## Apache 設定

- ポータルルート：`/var/www/html/`
- WIKI：`/var/www/html/wiki/`

`baseUrl` は `docusaurus.config.js` の `/wiki/` と一致させてください。

## トラブルシューティング

| 症状 | 対処 |
| ---- | ---- |
| `/wiki/` が 404 | `scripts/build-wiki.sh` を実行し `wiki/` をデプロイ |
| スタイル崩れ | `baseUrl` が `/wiki/` か確認 |
| ポータルリンク切れ | `docusaurus.config.js` の `../index.html` パスを確認 |
