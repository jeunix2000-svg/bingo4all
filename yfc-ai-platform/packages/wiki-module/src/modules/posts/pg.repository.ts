// wiki-module/src/modules/posts/pg.repository.ts
// PostgreSQL 実装（db/migrations の wiki.post スキーマに対応）。本番用。
import type { Pool } from 'pg';
import type { PostRepository } from './post.repository.js';
import type { PostCreateDto, PostUpdateDto, PostDetailDto, PostListQuery, PostPage, PostStatus } from './post.dto.js';

const COLS = `id, title, category_code AS "categoryCode", post_type AS "postType",
  status, confidentiality, summary, author_id AS "authorId",
  upvote_count AS "upvoteCount", is_resolved AS "isResolved", false AS "verified",
  to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SSZ') AS "createdAt"`;

export class PgPostRepository implements PostRepository {
  constructor(private pool: Pool) {}

  async create(authorId: string, dto: PostCreateDto): Promise<PostDetailDto> {
    const { rows } = await this.pool.query(
      `INSERT INTO wiki.post (wiki_ref, author_id, title, category_code, post_type, summary, confidentiality)
       VALUES (gen_random_uuid()::text, $1,$2,$3,$4,$5,$6)
       RETURNING ${COLS}, '' AS body, '{}'::text[] AS tags`,
      [authorId, dto.title, dto.categoryCode, dto.postType, dto.summary ?? '', dto.confidentiality]);
    return { ...rows[0], body: dto.body, tags: dto.tags ?? [] };
  }

  async findById(id: string): Promise<PostDetailDto | null> {
    const { rows } = await this.pool.query(
      `SELECT ${COLS}, '' AS body, '{}'::text[] AS tags FROM wiki.post WHERE id=$1 AND status<>'DELETED'`, [id]);
    return rows[0] ?? null;
  }

  async list(query: PostListQuery): Promise<PostPage> {
    const where: string[] = [`status <> 'DELETED'`]; const params: any[] = [];
    if (query.q)            { params.push(`%${query.q}%`); where.push(`(title ILIKE $${params.length} OR summary ILIKE $${params.length})`); }
    if (query.category)     { params.push(query.category); where.push(`category_code = $${params.length}`); }
    if (query.postType)     { params.push(query.postType); where.push(`post_type = $${params.length}`); }
    if (query.status)       { params.push(query.status); where.push(`status = $${params.length}`); }
    if (query.unresolvedOnly) where.push(`is_resolved = false`);
    const order = query.sort === 'popular' ? 'upvote_count DESC' : 'created_at DESC';
    const page = Math.max(1, query.page ?? 1); const size = Math.min(100, Math.max(1, query.size ?? 20));
    const w = where.join(' AND ');
    const totalRes = await this.pool.query(`SELECT count(*)::int AS c FROM wiki.post WHERE ${w}`, params);
    const { rows } = await this.pool.query(
      `SELECT ${COLS} FROM wiki.post WHERE ${w} ORDER BY ${order} LIMIT ${size} OFFSET ${(page-1)*size}`, params);
    return { items: rows, page, size, total: totalRes.rows[0].c };
  }

  async update(id: string, dto: PostUpdateDto): Promise<PostDetailDto> {
    const { rows } = await this.pool.query(
      `UPDATE wiki.post SET title=$2, category_code=$3, post_type=$4, summary=$5, confidentiality=$6
       WHERE id=$1 RETURNING ${COLS}, '' AS body, '{}'::text[] AS tags`,
      [id, dto.title, dto.categoryCode, dto.postType, dto.summary ?? '', dto.confidentiality]);
    return { ...rows[0], body: dto.body, tags: dto.tags ?? [] };
  }

  async setStatus(id: string, status: PostStatus): Promise<PostDetailDto> {
    const { rows } = await this.pool.query(
      `UPDATE wiki.post SET status=$2 WHERE id=$1 RETURNING ${COLS}, '' AS body, '{}'::text[] AS tags`, [id, status]);
    return rows[0];
  }

  async softDelete(id: string): Promise<void> {
    await this.pool.query(`UPDATE wiki.post SET status='DELETED' WHERE id=$1`, [id]);
  }
}
