---
sidebar_position: 2
---

# Coding Standard

Standards to unify output from Claude Code and similar tools. **Applied across all in-house AI projects.**

| Item | Standard |
| --- | --- |
| **Naming** | Variables/functions = camelCase, types/classes = PascalCase, constants = UPPER_SNAKE, DB = snake_case, API = kebab/plural (`/posts`) |
| **Folder** | Feature-based. Example: `/modules/posts/{controller,service,repository,dto,test}` |
| **Architecture (DDD/Clean)** | Layer separation: Controller → UseCase(Service) → Domain → Repository. Dependencies point inward |
| **Error codes** | `{DOMAIN}_{REASON}` format (e.g. `SELF_VOTE_FORBIDDEN`). HTTP = 400/401/403/404/409/500 |
| **Log Rule** | Structured JSON. Required: `ts`/`level`/`trace_id`/`actor_id`/`event`. Mask PII/confidential data |
| **Commit/PR** | Conventional Commits (feat/fix/docs…). PR requires template + Claude Review |

## Error Response Example

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "You cannot vote on your own post",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Layer Separation Principles

```
Controller  ── HTTP I/O, validation
    ↓
Service     ── Use cases, transaction boundaries
    ↓
Domain      ── Business rules (no external dependencies)
    ↓
Repository  ── DB/API access
```

The domain layer must not depend on frameworks or the DB.
