---
sidebar_position: 1
---

# Wiki Development Setup

The YFC AI Knowledge Platform design Wiki is a Docusaurus project in the `wiki-site/` directory.

## Specification Files

Design doc, OpenAPI, and SQL live in `wiki-site/static/spec/` and are published at `/wiki/spec/` after build.

- `YFC_AI_Knowledge_Platform設計書_V1.1.docx`
- `yfc_wiki_openapi.yaml`
- `yfc_points_service.sql`

## Requirements

- Node.js 18+
- npm 9+

## Initial Setup

```bash
cd wiki-site
npm install
```

## Local Preview

With `baseUrl: /wiki/`, serve from the **project root** via HTTP.  
Do not open `wiki/index.html` directly via file://.

```powershell
# Windows (from project root)
powershell -File scripts/serve-local.ps1
```

Open in browser:

- Portal: http://localhost:8080/index.html
- Wiki: http://localhost:8080/wiki/

Hot reload during development:

```bash
cd wiki-site
npm start
```

Open `http://localhost:3000/wiki/`.

## Production Build

From project root:

```bash
bash scripts/build-wiki.sh
```

Output goes to `wiki/` and is served at `/wiki/` on Apache.

## Multilingual (i18n)

| Locale | Example URL |
| --- | --- |
| Japanese (default) | `/wiki/docs/intro` |
| Chinese | `/wiki/zh-Hans/docs/intro` |
| English | `/wiki/en/docs/intro` |

Use the **locale dropdown** in the top-right navbar to switch languages.

- Japanese source: `wiki-site/docs/`
- Chinese: `wiki-site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`
- English: `wiki-site/i18n/en/docusaurus-plugin-content-docs/current/`

## Adding Documentation

1. Add Markdown under `wiki-site/docs/`
2. Mirror translations under `i18n/zh-Hans/` and `i18n/en/`
3. Update `wiki-site/sidebars.js`
4. Build and deploy

## Theme Customization

- Colors & fonts: `wiki-site/src/css/custom.css`
- Navbar & footer: `wiki-site/docusaurus.config.js`
