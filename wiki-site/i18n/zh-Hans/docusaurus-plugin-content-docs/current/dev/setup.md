---
sidebar_position: 1
---

# Wiki 开发环境搭建

YFC AI Knowledge Platform 设计 Wiki 是 `wiki-site/` 目录下的 Docusaurus 项目。

## 规格文件

设计书、OpenAPI、SQL 位于 `wiki-site/static/spec/`，构建后可通过 `/wiki/spec/` 下载。

- `YFC_AI_Knowledge_Platform設計書_V1.1.docx`
- `yfc_wiki_openapi.yaml`
- `yfc_points_service.sql`

## 环境要求

- Node.js 18 及以上
- npm 9 及以上

## 首次搭建

```bash
cd wiki-site
npm install
```

## 本地预览

Wiki 的 `baseUrl` 为 `/wiki/`，请从**项目根目录**启动 HTTP 服务器。  
不要直接双击 `wiki/index.html`（file:// 协议无法正常工作）。

```powershell
# Windows（从项目根目录）
powershell -File scripts/serve-local.ps1
```

浏览器访问：

- 门户: http://localhost:8080/index.html
- Wiki: http://localhost:8080/wiki/

开发时热重载：

```bash
cd wiki-site
npm start
```

打开 `http://localhost:3000/wiki/`。

## 生产构建

从项目根目录：

```bash
bash scripts/build-wiki.sh
```

构建产物输出到 `wiki/`，由 Apache 在 `/wiki/` 路径发布。

## 多语言（i18n）

| 语言 | URL 示例 |
| --- | --- |
| 日语（默认） | `/wiki/docs/intro` |
| 中文 | `/wiki/zh-Hans/docs/intro` |
| English | `/wiki/en/docs/intro` |

导航栏右上角 **语言切换** 下拉菜单可切换语言。

- 日语源文件: `wiki-site/docs/`
- 中文: `wiki-site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`
- 英文: `wiki-site/i18n/en/docusaurus-plugin-content-docs/current/`

## 添加文档

1. 在 `wiki-site/docs/` 添加 Markdown 文件
2. 同步翻译到 `i18n/zh-Hans/` 与 `i18n/en/` 对应目录
3. 更新 `wiki-site/sidebars.js`
4. 构建并部署

## 主题定制

- 颜色与字体: `wiki-site/src/css/custom.css`
- 导航与页脚: `wiki-site/docusaurus.config.js`
