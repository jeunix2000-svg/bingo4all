import { randomUUID } from 'node:crypto';
import type { ContributionRepository } from './contribution.repository.js';
import type { ContributionCreateDto, ContributionDto } from './contribution.dto.js';
export class InMemoryContributionRepository implements ContributionRepository {
  private store = new Map<string, ContributionDto>();
  async create(postId: string, authorId: string, dto: ContributionCreateDto): Promise<ContributionDto> {
    const c: ContributionDto = { id: randomUUID(), postId, authorId, kind: dto.kind, isAccepted: false, createdAt: new Date().toISOString() };
    this.store.set(c.id, c); return { ...c };
  }
  async findById(id: string) { const c = this.store.get(id); return c ? { ...c } : null; }
  async listByPost(postId: string) { return [...this.store.values()].filter(c => c.postId === postId); }
  async markAccepted(id: string) { const c = this.store.get(id)!; c.isAccepted = true; return { ...c }; }
}
