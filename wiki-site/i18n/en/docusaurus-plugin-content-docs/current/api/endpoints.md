---
sidebar_position: 2
---

# API Endpoint List

## Posts (posts / search)

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/posts` | Post list/search (`q`, `category`, `postType`, `sort`, paging) |
| `POST` | `/posts` | Create post |
| `GET` | `/posts/{id}` | Post detail |
| `PUT` | `/posts/{id}` | Edit post |
| `DELETE` | `/posts/{id}` | Logical delete |
| `POST` | `/posts/{id}/transition` | State transition |

## Evaluation (evaluation)

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/posts/{id}/votes` | Upvote/downvote (`direction`: 1 / -1) |
| `POST` | `/posts/{id}/ratings` | Multi-axis value rating (usefulness · accuracy · novelty) |
| `POST` | `/posts/{id}/verify` | Verified mark (reviewer or above) |

## Contributions (contributions)

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/posts/{id}/contributions` | Answer/supplement list |
| `POST` | `/posts/{id}/contributions` | Post answer/supplement |
| `POST` | `/contributions/{id}/accept` | Best answer/supplement acceptance |

## Statistics (stats)

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/stats/me` | Personal dashboard |
| `GET` | `/stats/org` | Organization-wide statistics |
| `GET` | `/stats/knowledge-gap` | Knowledge gap |

## Operations (moderation)

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/moderation/reports` | Report queue |
| `POST` | `/moderation/reports` | Report post |

## AI (ai)

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/ai/assist` | Summary/classification/tags/dedup/polish |
| `POST` | `/ai/review` | AI Reviewer (credibility · references) |

## Key Schemas

### PostCreate (required fields)

- `title`, `categoryCode`, `postType`, `summary`, `body`, `confidentiality`
- Optional: `tags[]`, `attachmentIds[]`

### ValueRating

- `usefulness`, `accuracy`, `novelty` — each 1–5

### UserStats

- `postCount`, `upvotesReceived`, `totalPoints`, `level`, `acceptedContribs`, `badges[]`

See [OpenAPI YAML](/spec/yfc_wiki_openapi.yaml) for complete schema definitions.
