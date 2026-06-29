---
sidebar_position: 1
---

# 积分微服务

承担 YFC 内部 Wiki **评分·排行榜·防作弊** 的独立微服务（ADR-002）。

📄 DDL: [下载 yfc_points_service.sql](/spec/yfc_points_service.sql)

## 设计方针（4 原则）

1. **`point_events` = 仅追加台账 (append-only ledger)** — 唯一真实来源。符合 ISMS/审计日志。
2. **余额/评价 = 派生聚合** — `award_points()` 在同一事务内同步更新。
3. **防作弊 (anti-gaming)** — 自投禁止 / 日上限 / 评价者评价加权 / 互赞检测 / 低质量惩罚。
4. **质 > 量** — 基础分低，主要得分来自他人评价·采纳·引用。规则数据化 (`point_rule`)。

## Schema 构成

| 分类 | 表 | 说明 |
| --- | --- | --- |
| A. 主数据 | `user_type`, `category`, `post_type`, `level_def`, `badge_def`, `point_rule` | 参考·评分规则 |
| B. 镜像 | `app_user`, `post`, `contribution` | Wiki 侧最小镜像 |
| C. 评价 | `vote`, `value_rating` | 投票·多轴评价 |
| D. 台账 | `point_event` | **仅追加·真实来源** |
| E. 聚合 | `user_point_balance`, `user_domain_reputation`, `user_badge`, `gaming_alert` | 派生数据 |

## 核心函数 `award_points()`

评分核心。在同一事务内：

1. 规则获取（禁用时 0 分）
2. 受益者决定（SELF / TARGET_AUTHOR）
3. 防作弊①：禁止自我操作
4. 防作弊②：日上限
5. 评价者评价加权（0.5〜1.5）
6. 台账记账（UNIQUE 防重复）
7. 余额 + 等级更新
8. 领域评价更新（≥800 获验证者资格）

## 评分规则（种子数据）

| rule_code | 说明 | 基础分 | 受益者 |
| --- | --- | --- | --- |
| `POST_CREATE` | 投稿 | +5 | SELF |
| `POST_UPVOTED` | +1 评价 | +1 | TARGET_AUTHOR |
| `POST_DOWNVOTED` | -1 评价（惩罚） | -3 | TARGET_AUTHOR |
| `POST_REFERENCED` | 被引用 | +3 | TARGET_AUTHOR |
| `ANSWER_CREATE` | 回答 | +3 | SELF |
| `ANSWER_ACCEPTED` | 回答采纳 | +15 | TARGET_AUTHOR |
| `SUPPLEMENT_CREATE` | 补充 | +2 | SELF |
| `SUPPLEMENT_ACCEPTED` | 补充采纳 | +8 | TARGET_AUTHOR |
| `REVIEW_GIVEN` | 提供评价 | +1 | SELF |
| `REVIEW_HELPFUL` | 评价有用 | +2 | TARGET_AUTHOR |
| `BEST_PRACTICE_BONUS` | BP 采纳 | +10 | TARGET_AUTHOR |

## 等级

| level | code | 名称 | 最低积分 |
| --- | --- | --- | --- |
| 1 | APPRENTICE | 见习 | 0 |
| 2 | REGULAR | 一般 | 100 |
| 3 | SENIOR | 高级 | 400 |
| 4 | EXPERT | 专家 | 1200 |
| 5 | MEISTER | 大师 | 3000 |

## 运维视图

| 视图 | 用途 |
| --- | --- |
| `v_leaderboard` | 全公司排行榜 |
| `v_knowledge_gap` | 知识缺口（未解决疑问较多的领域） |
| `v_user_stats` | 个人统计 |
| `v_org_stats` | 全公司仪表盘 |

详细表定义: [Schema 参考](./schema-reference)
