---
sidebar_position: 3
---

# ADR-002：积分服务独立微服务化

| 项目 | 内容 |
| --- | --- |
| **背景** | 积分是本公司独有 IP。与 Wiki 本体紧耦合会导致替换·审计·复用困难。 |
| **决定** | 作为 Webhook 联动的独立服务（Node/Express + 专用 schema）分离。 |
| **状态** | 采纳 (Accepted) |
| **影响** | 不受 Wiki 替换影响，其他模块也可复用。台账审计容易。 |
| **替代方案** | Wiki 内插件实现（耦合度过高·可移植性低） |

DDL 规格: [yfc_points_service.sql](/spec/yfc_points_service.sql)  
设计详情: [积分服务](../data/points-service)
