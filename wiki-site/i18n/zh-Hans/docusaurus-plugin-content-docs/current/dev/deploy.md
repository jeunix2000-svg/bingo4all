---
sidebar_position: 2
---

# 部署

## 手动部署（含 WIKI）

```bash
# 1. 构建 WIKI
bash scripts/build-wiki.sh

# 2. 同步整个门户
bash deploy.sh
```

## GitHub Actions

推送到 `main` / `master` 分支时自动部署。  
除 HTML / JS 变更外，`wiki-site/**` 变更时也会构建 WIKI 并部署到 `/wiki/`。

## Apache 配置

- 门户根目录：`/var/www/html/`
- WIKI：`/var/www/html/wiki/`

`baseUrl` 需与 `docusaurus.config.js` 的 `/wiki/` 一致。

## 故障排查

| 症状 | 处理 |
| ---- | ---- |
| `/wiki/` 404 | 执行 `scripts/build-wiki.sh` 并部署 `wiki/` |
| 样式错乱 | 确认 `baseUrl` 为 `/wiki/` |
| 门户链接失效 | 确认 `docusaurus.config.js` 的 `../index.html` 路径 |
