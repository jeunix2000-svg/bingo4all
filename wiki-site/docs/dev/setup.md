---
sidebar_position: 1
---

# WIKI 開発環境セットアップ

YFC AI Knowledge Platform の設計 Wiki は `wiki-site/` ディレクトリの Docusaurus プロジェクトです。

## 仕様ファイル

設計書・OpenAPI・SQL は `wiki-site/static/spec/` に配置され、ビルド後 `/wiki/spec/` からダウンロード可能です。

- `YFC_AI_Knowledge_Platform設計書_V1.1.docx`
- `yfc_wiki_openapi.yaml`
- `yfc_points_service.sql`

## 必要環境

- Node.js 18 以上
- npm 9 以上

## 初回セットアップ

```bash
cd wiki-site
npm install
```

## ローカルプレビュー

WIKI は `baseUrl: /wiki/` のため、**プロジェクトルート**から HTTP サーバーで配信してください。  
`wiki/index.html` を直接ダブルクリック（file://）では動作しません。

```powershell
# Windows（プロジェクトルートから）
powershell -File scripts/serve-local.ps1
```

ブラウザで開く：

- ポータル: http://localhost:8080/index.html
- WIKI: http://localhost:8080/wiki/

開発中にホットリロードする場合：

```bash
cd wiki-site
npm start
```

`http://localhost:3000/wiki/` を開きます。

## 本番ビルド

プロジェクトルートから：

```bash
bash scripts/build-wiki.sh
```

または：

```bash
cd wiki-site
npm run build
cp -r build ../wiki
```

ビルド成果物は `wiki/` に出力され、Apache の `/wiki/` で公開されます。

## 多言語（i18n）

| ロケール | URL 例 |
| --- | --- |
| 日本語（既定） | `/wiki/docs/intro` |
| 中文 | `/wiki/zh-Hans/docs/intro` |
| English | `/wiki/en/docs/intro` |

- ナビバー右上の **言語切替** ドロップダウンで切り替え
- 日本語ソース: `wiki-site/docs/`
- 中文訳: `wiki-site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`
- 英文訳: `wiki-site/i18n/en/docusaurus-plugin-content-docs/current/`
- UI 文言: `wiki-site/i18n/{locale}/code.json` ほか

翻訳追加後:

```bash
npm run build   # 全ロケールをビルド
```

## ドキュメントの追加

1. `wiki-site/docs/` に Markdown ファイルを追加
2. `wiki-site/sidebars.js` に項目を追加
3. ビルドしてデプロイ

## テーマカスタマイズ

- 色・フォント：`wiki-site/src/css/custom.css`
- ナビ・フッター：`wiki-site/docusaurus.config.js`
