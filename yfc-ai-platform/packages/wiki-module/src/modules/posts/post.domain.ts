// wiki-module/src/modules/posts/post.domain.ts
// 投稿ライフサイクルの状態機械（設計書V1.0 第9章）と入力検証（ドメイン純粋ロジック）。
import type { PostCreateDto, PostStatus, TransitionAction } from './post.dto.js';
import { POST_TYPES, CONFIDENTIALITIES } from './post.dto.js';
import { Errors } from '../../shared/errors.js';

// action → (現状態 → 次状態)
const TRANSITIONS: Record<TransitionAction, Partial<Record<PostStatus, PostStatus>>> = {
  submit:  { DRAFT: 'SUBMITTED' },
  approve: { SUBMITTED: 'APPROVED', REVIEW: 'APPROVED' },
  publish: { APPROVED: 'PUBLISHED' },
  archive: { PUBLISHED: 'ARCHIVED' },
  restore: { ARCHIVED: 'PUBLISHED', DELETED: 'DRAFT' },
};

export function nextStatus(current: PostStatus, action: TransitionAction): PostStatus {
  const to = TRANSITIONS[action]?.[current];
  if (!to) throw Errors.invalidTransition(current, action);
  return to;
}

export function validateCreate(dto: PostCreateDto): void {
  if (!dto || typeof dto !== 'object') throw Errors.validation('本文が不正です');
  if (!dto.title || dto.title.length > 200) throw Errors.validation('titleは1〜200文字');
  if (!dto.categoryCode) throw Errors.validation('categoryCodeは必須');
  if (!POST_TYPES.includes(dto.postType)) throw Errors.validation('postTypeが不正');
  if (!CONFIDENTIALITIES.includes(dto.confidentiality)) throw Errors.validation('confidentialityが不正');
  if (dto.summary && dto.summary.length > 500) throw Errors.validation('summaryは500文字以内');
  if (typeof dto.body !== 'string' || dto.body.length === 0) throw Errors.validation('bodyは必須');
}
