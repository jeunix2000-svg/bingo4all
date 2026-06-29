---
sidebar_position: 1
---

# CI/CD·DevSecOps

安全不后装，而是嵌入各阶段（Shift-Left）。

## 流水线阶段

| 阶段 | 内容 | 门禁/成果物 |
| --- | --- | --- |
| **Source** | GitHub·分支保护 | 禁止直 push·必须 PR |
| **Pull Request** | Claude Review 自动评审 | 规范/设计一致/脆弱模式指摘 |
| **Build/Test** | GitHub Actions | Unit/Integration·覆盖率 ≥ 80% |
| **Security** | SAST/依赖/密钥/IaC | CodeQL·零漏洞通过 |
| **Deploy** | Azure（验证→生产） | 生产需申请审批 |
| **Monitor** | Azure Monitor/SIEM | Audit 联动·告警 |

## 本仓库的部署

门户 + Wiki 静态部署通过 GitHub Actions rsync 到 Apache：

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

Wiki 设计书·OpenAPI·SQL 的更新也会在 `wiki-site/**` 变更时重新构建。

## 环境隔离

- 开发 / 验证 / 生产分离
- 生产反映以回滚步骤为前提
- DB 账户分离（STRIDE: Elevation of Privilege 对策）

参见 [部署步骤](../dev/deploy)。
