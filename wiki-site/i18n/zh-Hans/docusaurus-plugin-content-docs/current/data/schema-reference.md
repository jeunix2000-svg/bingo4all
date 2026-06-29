---
sidebar_position: 2
---

# 数据库 Schema 参考

PostgreSQL 14+，`points` schema。

## 分类层级

```
TECH（技术）
├── LEGACY（遗留 COBOL/JCL）
├── AI（AI/LLM）
└── INFRA（基础设施）
BIZ（业务）
MGMT（管理）
DOMAIN（客户行业知识）
```

## 用户分类

| code | 说明 | 经营·人事可阅 |
| --- | --- | --- |
| `EMPLOYEE` | 正式员工 | 可 |
| `PARTNER` | 驻场/合作公司 | 不可 |

## 徽章

| code | 名称 |
| --- | --- |
| `FIRST_POST` | 首次投稿 |
| `STREAK` | 连续投稿 |
| `SAVIOR` | 救世主（解决大量疑问） |
| `GUARDIAN` | 知识守护者 |
| `REVIEWER` | 评审达人 |
| `LEARN_FROM_FAIL` | 从失败中学习 |

## 触发器（自动评分）

| 触发器 | 事件 | 规则 |
| --- | --- | --- |
| `post_after_insert` | 投稿创建 | `POST_CREATE` |
| `vote_after_insert` | 投票 | `POST_UPVOTED` / `POST_DOWNVOTED` + 互赞检测 |
| `vote_before_insert` | 自投 | **EXCEPTION 拒绝** |
| `contrib_after_insert` | 贡献创建 | `ANSWER_CREATE` / `SUPPLEMENT_CREATE` |
| `contrib_after_update` | 采纳 | `ANSWER_ACCEPTED` / `SUPPLEMENT_ACCEPTED` |

## 月度批处理

`accrue_evergreen()` — 净点赞≥10 且经过 90 天以上的常青文章每月 +2 分（复利）。

## 防作弊告警

`gaming_alert` 表 — 记录互赞环 (`MUTUAL_VOTE_RING`) 等，供人工审查。

完整 DDL 参见 [yfc_points_service.sql](/spec/yfc_points_service.sql)。
