// wiki-module/src/server.ts — 本番エントリ（PostgreSQL実装 + point-serviceへHTTP連携）
import pg from 'pg';
import { buildApp } from './app.js';
import { PgPostRepository } from './modules/posts/pg.repository.js';
import { PgVoteRepository } from './modules/votes/pg.voteRepository.js';
import { PgRatingRepository } from './modules/ratings/pg.ratingRepository.js';
import { PgContributionRepository } from './modules/contributions/pg.contributionRepository.js';
import { HttpPointsClient } from './shared/pointsClient.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = buildApp({
  posts: new PgPostRepository(pool),
  votes: new PgVoteRepository(pool),
  ratings: new PgRatingRepository(pool),
  contributions: new PgContributionRepository(pool),
  points: new HttpPointsClient(process.env.POINT_SERVICE_URL ?? 'http://point-service:8081'),
});
const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`[wiki-module] listening on :${port}`));
