// wiki-module/src/modules/ratings/rating.service.ts
import type { PostRepository } from '../posts/post.repository.js';
import type { PointsClient } from '../../shared/pointsClient.js';
import type { Principal } from '../../shared/auth.middleware.js';
import { Errors } from '../../shared/errors.js';

export interface ValueRating { usefulness: number; accuracy: number; novelty: number; }
export interface RatingRepository { upsert(raterId: string, postId: string, r: ValueRating): Promise<void>; }

export class RatingService {
  constructor(private posts: PostRepository, private ratings: RatingRepository, private points: PointsClient) {}

  async rate(user: Principal, postId: string, r: ValueRating): Promise<void> {
    for (const k of ['usefulness', 'accuracy', 'novelty'] as const) {
      const v = (r as any)[k];
      if (!Number.isInteger(v) || v < 1 || v > 5) throw Errors.validation(`${k}は1〜5`);
    }
    const post = await this.posts.findById(postId);
    if (!post) throw Errors.postNotFound();
    await this.ratings.upsert(user.id, postId, r);
    // 「誠実な評価」を評価者へ加点（日次上限5は point-service が強制）
    await this.points.emit({
      ruleCode: 'RATING_GIVE', beneficiaryId: user.id, actorId: user.id,
      refType: 'rating', refId: `${postId}:${user.id}`,
    });
  }
}
