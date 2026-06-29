// wiki-module/src/modules/contributions/pg.contributionRepository.ts
import type { Pool } from 'pg';
import type { ContributionRepository } from './contribution.repository.js';
import type { ContributionCreateDto, ContributionDto } from './contribution.dto.js';

const COLS = `id, post_id AS "postId", author_id AS "authorId", kind,
  is_accepted AS "isAccepted", to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SSZ') AS "createdAt"`;

export class PgContributionRepository implements ContributionRepository {
  constructor(private pool: Pool) {}
  async create(postId: string, authorId: string, dto: ContributionCreateDto): Promise<ContributionDto> {
    const { rows } = await this.pool.query(
      `INSERT INTO wiki.contribution (post_id, author_id, kind) VALUES ($1,$2,$3) RETURNING ${COLS}`,
      [postId, authorId, dto.kind]);
    return rows[0];
  }
  async findById(id: string): Promise<ContributionDto | null> {
    const { rows } = await this.pool.query(`SELECT ${COLS} FROM wiki.contribution WHERE id=$1`, [id]);
    return rows[0] ?? null;
  }
  async listByPost(postId: string): Promise<ContributionDto[]> {
    const { rows } = await this.pool.query(`SELECT ${COLS} FROM wiki.contribution WHERE post_id=$1 ORDER BY created_at`, [postId]);
    return rows;
  }
  async markAccepted(id: string): Promise<ContributionDto> {
    const { rows } = await this.pool.query(
      `UPDATE wiki.contribution SET is_accepted=true WHERE id=$1 RETURNING ${COLS}`, [id]);
    return rows[0];
  }
}
