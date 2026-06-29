---
sidebar_position: 2
---

# Deploy

## Manual Deploy (Including Wiki)

```bash
# 1. Build Wiki
bash scripts/build-wiki.sh

# 2. Sync entire portal
bash deploy.sh
```

## GitHub Actions

Automatic deploy on push to `main` / `master`.  
In addition to HTML/JS changes, Wiki is built and deployed to `/wiki/` when `wiki-site/**` changes.

## Apache Configuration

- Portal root: `/var/www/html/`
- Wiki: `/var/www/html/wiki/`

Ensure `baseUrl` matches `/wiki/` in `docusaurus.config.js`.

## Troubleshooting

| Symptom | Fix |
| ---- | ---- |
| `/wiki/` returns 404 | Run `scripts/build-wiki.sh` and deploy `wiki/` |
| Broken styles | Verify `baseUrl` is `/wiki/` |
| Broken portal links | Check `../index.html` paths in `docusaurus.config.js` |
