# YFC WIKI (Docusaurus)

YFC Portal 用の Docusaurus Classic テンプレートです。

## クイックスタート

```bash
npm install
npm start      # http://localhost:3000/wiki/
npm run build  # build/ に出力
```

## プロジェクトルートからビルド＆配置

```bash
bash ../scripts/build-wiki.sh
```

`../wiki/` に静的ファイルが配置されます。

## 構成

- `docs/` — Markdown ドキュメント
- `src/pages/index.js` — ランディングページ
- `src/css/custom.css` — YFC ポータル風ダークテーマ
- `docusaurus.config.js` — `baseUrl: /wiki/`

## ドキュメント追加

1. `docs/` に `.md` を追加
2. `sidebars.js` を更新
3. ビルドしてデプロイ
