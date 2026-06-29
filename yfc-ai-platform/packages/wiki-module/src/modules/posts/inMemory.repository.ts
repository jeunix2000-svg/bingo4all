// wiki-module/src/modules/posts/inMemory.repository.ts
// 開発/テスト用のインメモリ実装。DBなしでAPIを調通させる。
import { randomUUID } from 'node:crypto';
import type { PostRepository } from './post.repository.js';
import type { PostCreateDto, PostUpdateDto, PostDetailDto, PostListQuery, PostPage, PostStatus } from './post.dto.js';

interface Row extends PostDetailDto {}

export class InMemoryPostRepository implements PostRepository {
  private store = new Map<string, Row>();

  async create(authorId: string, dto: PostCreateDto): Promise<PostDetailDto> {
    const id = randomUUID();
    const row: Row = {
      id, title: dto.title, categoryCode: dto.categoryCode, postType: dto.postType,
      status: 'DRAFT', confidentiality: dto.confidentiality, summary: dto.summary ?? '',
      authorId, upvoteCount: 0, isResolved: false, verified: false,
      createdAt: new Date().toISOString(), body: dto.body, tags: dto.tags ?? [],
    };
    this.store.set(id, row);
    return { ...row };
  }

  async findById(id: string): Promise<PostDetailDto | null> {
    const r = this.store.get(id);
    return r && r.status !== 'DELETED' ? { ...r } : null;
  }

  async list(query: PostListQuery): Promise<PostPage> {
    let items = [...this.store.values()].filter(r => r.status !== 'DELETED');
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(r => r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.body.toLowerCase().includes(q));
    }
    if (query.category)   items = items.filter(r => r.categoryCode === query.category);
    if (query.postType)   items = items.filter(r => r.postType === query.postType);
    if (query.status)     items = items.filter(r => r.status === query.status);
    if (query.unresolvedOnly) items = items.filter(r => !r.isResolved);
    if (query.sort === 'popular') items.sort((a, b) => b.upvoteCount - a.upvoteCount);
    else items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const page = Math.max(1, query.page ?? 1);
    const size = Math.min(100, Math.max(1, query.size ?? 20));
    const total = items.length;
    const slice = items.slice((page - 1) * size, page * size).map(stripBody);
    return { items: slice, page, size, total };
  }

  async update(id: string, dto: PostUpdateDto): Promise<PostDetailDto> {
    const r = this.store.get(id)!;
    Object.assign(r, {
      title: dto.title, categoryCode: dto.categoryCode, postType: dto.postType,
      summary: dto.summary ?? r.summary, body: dto.body,
      confidentiality: dto.confidentiality, tags: dto.tags ?? r.tags,
    });
    return { ...r };
  }

  async setStatus(id: string, status: PostStatus): Promise<PostDetailDto> {
    const r = this.store.get(id)!; r.status = status; return { ...r };
  }

  async softDelete(id: string): Promise<void> {
    const r = this.store.get(id); if (r) r.status = 'DELETED';
  }
}

function stripBody(r: PostDetailDto) {
  const { body, tags, ...rest } = r; return rest as any;
}
