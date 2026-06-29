import type { ContributionCreateDto, ContributionDto } from './contribution.dto.js';
export interface ContributionRepository {
  create(postId: string, authorId: string, dto: ContributionCreateDto): Promise<ContributionDto>;
  findById(id: string): Promise<ContributionDto | null>;
  listByPost(postId: string): Promise<ContributionDto[]>;
  markAccepted(id: string): Promise<ContributionDto>;
}
