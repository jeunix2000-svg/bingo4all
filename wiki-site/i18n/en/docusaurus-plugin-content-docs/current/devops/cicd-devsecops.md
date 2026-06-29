---
sidebar_position: 1
---

# CI/CD · DevSecOps

Embed security at each stage rather than bolting it on afterward (Shift-Left).

## Pipeline Stages

| Stage | Content | Gate/Artifact |
| --- | --- | --- |
| **Source** | GitHub · branch protection | Direct push forbidden · PR required |
| **Pull Request** | Claude Review auto-review | Standards/design alignment/vulnerable pattern detection |
| **Build/Test** | GitHub Actions | Unit/Integration · coverage ≥ 80% |
| **Security** | SAST/dependencies/secrets/IaC | CodeQL · pass with zero vulnerabilities |
| **Deploy** | Azure (staging → production) | Production requires approval workflow |
| **Monitor** | Azure Monitor/SIEM | Audit integration · alerts |

## This Repository's Deployment

Portal + Wiki static deployment via GitHub Actions rsync to Apache:

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

Updates to the Wiki design document, OpenAPI, and SQL also trigger rebuild on `wiki-site/**` changes.

## Environment Separation

- Separate development / staging / production
- Production rollout assumes rollback procedures
- DB account separation (STRIDE: Elevation of Privilege countermeasure)

See [Deploy Guide](../dev/deploy).
