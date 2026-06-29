// wiki-module/src/modules/votes/vote.service.ts
import type { PostRepository } from '../posts/post.repository.js';
import type { PointsClient } from '../../shared/pointsClient.js';
import type { Principal } from '../../shared/auth.middleware.js';
import { Errors } from '../../shared/errors.js';

export interface VoteRepository {
  upsert(voterId: string, postId: string, direction: 1 | -1): Promise<void>;
}

export class VoteService {
  constructor(private posts: PostRepository, private votes: VoteRepository, private points: PointsClient) {}

  async vote(user: Principal, postId: string, direction: 1 | -1): Promise<void> {
    const post = await this.posts.findById(postId);
    if (!post) throw Errors.postNotFound();
    if (post.authorId === user.id) throw Errors.selfVoteForbidden();   // 自票拒否（Wiki側）
    await this.votes.upsert(user.id, postId, direction);
    if (direction === 1) {
      // 投稿者へ「いいね獲得」を加点（point-service側でも自票/加重を検証）
      await this.points.emit({
        ruleCode: 'UPVOTE_RECEIVED', beneficiaryId: post.authorId, actorId: user.id,
        refType: 'vote', refId: `${postId}:${user.id}`, raterReputation: 1.0,
      });
    }
  }
}
