---
sidebar_position: 3
---

# 安全威胁模型（STRIDE）

以 STRIDE 体系化威胁，并与 ISMS / P 标记统制保持一致。

| 威胁 (STRIDE) | 对象 | 预期威胁 | 对策 |
| --- | --- | --- | --- |
| **Spoofing** | 认证 | 冒充登录 | Entra SSO/MFA·令牌验证·不在本公司保存凭据 |
| **Tampering** | 数据 | 投稿/积分篡改 | RBAC·输入验证·`point_event` 仅追加·完整性约束 |
| **Repudiation** | 操作 | 操作否认 | 审计日志 (Audit Catalog)·仅追加台账·`trace_id` |
| **Information Disclosure** | 机密 | 机密误公开/泄露 | 机密等级+权限过滤·存储加密·机密正文 AI 不发送 |
| **Denial of Service** | 可用性 | 过载/滥用 | 速率限制·TPS 上限·WAF·自动扩展 |
| **Elevation of Privilege** | 权限 | 权限提升 | 最小权限·权限变更高严重度审计·DB 账户分离 |

## AI 特有对策

**提示词注入对策**:

- 外部输入与系统指令分离
- 默认不向 AI 传递机密数据（Gateway 控制）
- `CONFIDENTIAL` 等级在 AI Gateway 阻断

## 错误码示例

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "禁止对自己的投稿投票",
  "traceId": "abc-123"
}
```

格式: `{DOMAIN}_{REASON}` — 参见 [编码规范](../devops/coding-standard)。
