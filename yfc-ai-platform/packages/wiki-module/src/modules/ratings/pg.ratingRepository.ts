// wiki-module/src/modules/ratings/pg.ratingRepository.ts
import type { Pool } from 'pg';
import type { RatingRepository, ValueRating } from './rating.service.js';

export class PgRatingRepository implements RatingRepository {
  constructor(private pool: Pool) {}
  async upsert(raterId: string, postId: string, r: ValueRating): Promise<void> {
    await this.pool.query(
      `INSERT INTO wiki.value_rating (rater_id, post_id, usefulness, accuracy, novelty)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (rater_id, post_id)
       DO UPDATE SET usefulness=EXCLUDED.usefulness, accuracy=EXCLUDED.accuracy, novelty=EXCLUDED.novelty`,
      [raterId, postId, r.usefulness, r.accuracy, r.novelty]);
  }
}
