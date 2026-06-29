// wiki-module/src/modules/posts/post.service.ts  (UseCase/Service層)
// 依存は内向き：Service → Domain/Repository。外部I/Oはインターフェースで注入。
import type {
  PostCreateDto, PostUpdateDto, PostDto, PostDetailDto, PostListQuery, PostPage, TransitionAction,
} from './post.dto.js';
import type { PostRepository } from './post.repository.js';
import { validateCreate, nextStatus } from './post.domain.js';
import { Errors } from '../../shared/errors.js';

export interface AiAssist {
  assist(input: { title: string; body: string }): Promise<{ summary: string; tags: string[]; duplicates: { postId: string; similarity: number }[] }>;
}
import type { PointsClient } from '../../shared/pointsClient.js';
export interface Principal { id: string; role: string; department?: string | null; }

const PRIVILEGED = new Set(['MODERATOR', 'IT_ADMIN']);

export class PostService {
  constructor(private repo: PostRepository, private ai: AiAssist, private points: PointsClient) {}

  async create(user: Principal, dto: PostCreateDto): Promise<PostDetailDto> {
    validateCreate(dto);
    // 機密区分=機密の本文はAIに送らない（STRIDE/Gateway規約）
    if (dto.confidentiality !== 'CONFIDENTIAL') {
      const ai = await this.ai.assist({ title: dto.title, body: dto.body });
      if (!dto.summary) dto.summary = ai.summary;
      if (!dto.tags?.length) dto.tags = ai.tags;
    }
    const post = await this.repo.create(user.id, dto);
    await this.points.emit({ ruleCode: 'POST_CREATE', beneficiaryId: user.id, refType: 'post', refId: post.id });
    return post;
  }

  async get(id: string): Promise<PostDetailDto> {
    const post = await this.repo.findById(id);
    if (!post) throw Errors.postNotFound();
    return post;
  }

  async list(query: PostListQuery): Promise<PostPage> { return this.repo.list(query); }

  async update(user: Principal, id: string, dto: PostUpdateDto): Promise<PostDetailDto> {
    validateCreate(dto);
    const existing = await this.repo.findById(id);
    if (!existing) throw Errors.postNotFound();
    this.assertCanModify(user, existing);
    return this.repo.update(id, dto);
  }

  async remove(user: Principal, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Errors.postNotFound();
    this.assertCanModify(user, existing);
    await this.repo.softDelete(id);   // 論理削除（監査ログ前提）
  }

  async transition(user: Principal, id: string, action: TransitionAction): Promise<PostDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Errors.postNotFound();
    // approve/publish/archive/restore は権限者、submit は作者でも可
    if (action !== 'submit') this.assertPrivileged(user);
    else this.assertCanModify(user, existing);
    const to = nextStatus(existing.status, action);    // 状態機械（不正は409）
    return this.repo.setStatus(id, to);
  }

  private assertCanModify(user: Principal, post: PostDto) {
    if (post.authorId !== user.id && !PRIVILEGED.has(user.role)) throw Errors.forbidden();
  }
  private assertPrivileged(user: Principal) {
    if (!PRIVILEGED.has(user.role)) throw Errors.forbidden();
  }
}
