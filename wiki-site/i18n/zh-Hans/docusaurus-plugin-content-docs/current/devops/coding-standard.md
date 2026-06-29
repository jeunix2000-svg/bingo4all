---
sidebar_position: 2
---

# 编码规范

统一 Claude Code 等生成输出的规范。**全 AI 内制项目通用适用**。

| 项目 | 规范 |
| --- | --- |
| **命名 (Naming)** | 变量/函数 = camelCase、类型/类 = PascalCase、常量 = UPPER_SNAKE、DB = snake_case、API = kebab/复数形 (`/posts`) |
| **文件夹 (Folder)** | 功能单位 (feature-based)。例: `/modules/posts/{controller,service,repository,dto,test}` |
| **架构 (DDD/Clean)** | 层分离: Controller → UseCase(Service) → Domain → Repository。依赖向内 |
| **错误码** | `{DOMAIN}_{REASON}` 格式（例: `SELF_VOTE_FORBIDDEN`）。HTTP = 400/401/403/404/409/500 |
| **日志 (Log Rule)** | 结构化 JSON。必填: `ts`/`level`/`trace_id`/`actor_id`/`event`。个人信息/机密需脱敏 |
| **提交/PR** | Conventional Commits（feat/fix/docs…）。PR 需模板 + Claude Review |

## 错误响应示例

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "不能对自己的投稿投票",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 层分离原则

```
Controller  ── HTTP 输入输出、验证
    ↓
Service     ── 用例、事务边界
    ↓
Domain      ── 业务规则（不依赖外部）
    ↓
Repository  ── DB/API 访问
```

领域层不依赖框架·DB。
