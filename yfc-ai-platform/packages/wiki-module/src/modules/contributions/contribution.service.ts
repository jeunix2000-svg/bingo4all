// wiki-module/src/modules/contributions/contribution.service.ts
import type { PostRepository } from '../posts/post.repository.js';
import type { ContributionRepository } from './contribution.repository.js';
import type { ContributionCreateDto, ContributionDto } from './contribution.dto.js';
import type { PointsClient } from '../../shared/pointsClient.js';
import type { Principal } from '../../shared/auth.middleware.js';
import { Errors } from '../../shared/errors.js';

const PRIVILEGED = new Set(['MODERATOR', 'IT_ADMIN', 'REVIEWER']);

export class ContributionService {
  constructor(
    private posts: PostRepository,
    private repo: ContributionRepository,
    private points: PointsClient,
  ) {}

  async add(user: Principal, postId: string, dto: ContributionCreateDto): Promise<ContributionDto> {
    if (dto.kind !== 'ANSWER' && dto.kind !== 'SUPPLEMENT') throw Errors.validation('kindは ANSWER|SUPPLEMENT');
    if (!dto.body) throw Errors.validation('bodyは必須');
    const post = await this.posts.findById(postId);
    if (!post) throw Errors.postNotFound();
    const c = await this.repo.create(postId, user.id, dto);
    // 回答+3 / 補足+2 を投稿者（=貢献者）へ
    await this.points.emit({
      ruleCode: dto.kind === 'ANSWER' ? 'ANSWER_CREATE' : 'SUPPLEMENT_CREATE',
      beneficiaryId: user.id, actorId: user.id, refType: 'contribution', refId: c.id,
    });
    return c;
  }

  async accept(user: Principal, contributionId: string): Promise<ContributionDto> {
    const c = await this.repo.findById(contributionId);
    if (!c) throw Errors.postNotFound();
    const post = await this.posts.findById(c.postId);
    if (!post) throw Errors.postNotFound();
    // 採択できるのは 質問者本人 または レビュア/モデレータ
    if (post.authorId !== user.id && !PRIVILEGED.has(user.role)) throw Errors.forbidden('採択権限がありません');

    const accepted = await this.repo.markAccepted(contributionId);
    // 採択加点：回答+15 / 補足+8 を貢献者へ
    await this.points.emit({
      ruleCode: c.kind === 'ANSWER' ? 'ANSWER_ACCEPTED' : 'SUPPLEMENT_ACCEPTED',
      beneficiaryId: c.authorId, actorId: user.id, refType: 'accept', refId: contributionId,
    });
    if (c.kind === 'ANSWER') {
      // 投稿にベストアンサーが付いた：投稿者へ+20、疑問を解決済みに
      await this.points.emit({
        ruleCode: 'POST_BEST_ANSWER', beneficiaryId: post.authorId, actorId: user.id,
        refType: 'post', refId: post.id,
      });
      await this.posts.setStatus(post.id, post.status);  // 状態は維持（解決フラグは別途）
    }
    return accepted;
  }

  async list(postId: string): Promise<ContributionDto[]> { return this.repo.listByPost(postId); }
}
