import type { VoteRepository } from './vote.service.js';
export class InMemoryVoteRepository implements VoteRepository {
  private set = new Set<string>();
  async upsert(voterId: string, postId: string, _direction: 1 | -1): Promise<void> {
    this.set.add(`${voterId}:${postId}`);   // UNIQUE(voter, post)
  }
}
