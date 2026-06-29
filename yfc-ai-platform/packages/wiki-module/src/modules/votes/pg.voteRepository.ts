// wiki-module/src/modules/votes/pg.voteRepository.ts
import type { Pool } from 'pg';
import type { VoteRepository } from './vote.service.js';
import { AppError } from '../../shared/errors.js';

export class PgVoteRepository implements VoteRepository {
  constructor(private pool: Pool) {}
  async upsert(voterId: string, postId: string, direction: 1 | -1): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO wiki.vote (voter_id, post_id, direction) VALUES ($1,$2,$3)
         ON CONFLICT (voter_id, post_id) DO UPDATE SET direction = EXCLUDED.direction`,
        [voterId, postId, direction]);
      if (direction === 1)
        await this.pool.query(`UPDATE wiki.post SET upvote_count = upvote_count + 1 WHERE id = $1`, [postId]);
    } catch (e: any) {
      // DBトリガ（自票拒否）を業務エラーに変換
      if (typeof e?.message === 'string' && e.message.includes('SELF_VOTE_FORBIDDEN'))
        throw new AppError('SELF_VOTE_FORBIDDEN', '自己の投稿には投票できません', 403);
      throw e;
    }
  }
}
