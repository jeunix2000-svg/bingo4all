---
sidebar_position: 3
---

# ADR-002: Separate Points Service as Independent Microservice

| Item | Description |
| --- | --- |
| **Context** | Points are proprietary IP. Tight coupling to the Wiki core makes replacement, audit, and reuse difficult. |
| **Decision** | Separate as an independent service (Node/Express + dedicated schema) with webhook integration. |
| **Status** | Accepted |
| **Consequences** | Unaffected by Wiki replacement; reusable from other modules. Ledger audit is straightforward. |
| **Alternatives** | Wiki plugin implementation (excessive coupling, low portability) |

DDL specification: [yfc_points_service.sql](/spec/yfc_points_service.sql)  
Design details: [Points Service](../data/points-service)
