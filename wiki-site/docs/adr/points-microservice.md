---
sidebar_position: 3
---

# ADR-002：積分サービスを独立マイクロサービス化

| 項目 | 内容 |
| --- | --- |
| **背景** | 積分は当社独自 IP。Wiki 本体に密結合すると差し替え・監査・再利用が困難。 |
| **決定** | Webhook 連携の独立サービス（Node/Express + 専用スキーマ）として分離する。 |
| **状態** | 採用 (Accepted) |
| **影響** | Wiki 差し替えに影響されず、他モジュールからも再利用可能。台帳監査が容易。 |
| **代替案** | Wiki 内プラグイン実装（結合度過大・移植性低） |

DDL 仕様: [yfc_points_service.sql](/spec/yfc_points_service.sql)  
設計詳細: [ポイントサービス](../data/points-service)
