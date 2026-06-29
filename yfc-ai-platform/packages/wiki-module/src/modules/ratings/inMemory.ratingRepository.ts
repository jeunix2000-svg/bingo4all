import type { RatingRepository, ValueRating } from './rating.service.js';
export class InMemoryRatingRepository implements RatingRepository {
  private map = new Map<string, ValueRating>();
  async upsert(raterId: string, postId: string, r: ValueRating): Promise<void> {
    this.map.set(`${raterId}:${postId}`, r);   // UNIQUE(rater, post)
  }
}
