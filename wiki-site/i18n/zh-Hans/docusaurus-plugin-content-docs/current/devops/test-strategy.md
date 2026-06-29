---
sidebar_position: 3
---

# 测试策略

## 测试类型

| 类型 | 对象 | 工具（预期） | 基准 |
| --- | --- | --- | --- |
| **Unit** | 评分函数·领域逻辑 | Jest / Vitest | 覆盖率 ≥ 80% |
| **Integration** | API + DB·契约测试 | Supertest / pgTAP | 主要 API 全覆盖 |
| **E2E** | 主要场景（投稿〜采纳） | Playwright | Must 路径全覆盖 |
| **Security** | STRIDE 项验证 | ZAP / CodeQL | 零漏洞 |
| **Performance** | TPS/P95 ([性能需求](../design/nfr-performance)) | k6 / Locust | SLO 达成 |
| **AI Prompt** | 各 Agent 输出妥当性 | 固定输入回归 | Schema/置信度稳定 |

## 重点测试用例

### 评分 (Points Service)

- 自投 → `SELF_VOTE_FORBIDDEN` / DB EXCEPTION
- 日上限超限 → 0 分（静默丢弃）
- 互赞环 → `gaming_alert` 记录
- `point_event` UNIQUE 重复 → 0 分（幂等）

### Wiki API

- 非法状态迁移 → 409 Conflict
- RBAC 权限不足 → 403 Forbidden
- 机密等级过滤

### AI

- `CONFIDENTIAL` 正文 Gateway 阻断
- Prompt 回归（固定输入 → 预期 Schema）

## CI 门禁

PR 合并条件: Unit ≥ 80% + Integration 通过 + CodeQL 零 + Claude Review 批准。
