// wiki-module/src/modules/posts/post.dto.ts
// OpenAPI (openapi/yfc_wiki_openapi.yaml) のスキーマに対応するDTO。
export type PostType = 'SHARE' | 'QUESTION' | 'REVIEW_ITEM' | 'HOWTO' | 'POSTMORTEM' | 'BEST_PRACTICE';
export type PostStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
export type Confidentiality = 'PUBLIC' | 'INTERNAL' | 'DEPT' | 'CONFIDENTIAL';
export type TransitionAction = 'submit' | 'approve' | 'publish' | 'archive' | 'restore';

export const POST_TYPES: PostType[] = ['SHARE', 'QUESTION', 'REVIEW_ITEM', 'HOWTO', 'POSTMORTEM', 'BEST_PRACTICE'];
export const CONFIDENTIALITIES: Confidentiality[] = ['PUBLIC', 'INTERNAL', 'DEPT', 'CONFIDENTIAL'];

export interface PostCreateDto {
  title: string;            // 1..200
  categoryCode: string;
  postType: PostType;
  summary: string;          // <=500
  body: string;             // Markdown
  confidentiality: Confidentiality;
  tags?: string[];
  attachmentIds?: string[];
}
export type PostUpdateDto = PostCreateDto;

export interface PostDto {
  id: string;
  title: string;
  categoryCode: string;
  postType: PostType;
  status: PostStatus;
  confidentiality: Confidentiality;
  summary: string;
  authorId: string;
  upvoteCount: number;
  isResolved: boolean;
  verified: boolean;
  createdAt: string;
}
export interface PostDetailDto extends PostDto { body: string; tags: string[]; }

export interface PostListQuery {
  q?: string; category?: string; postType?: PostType; status?: PostStatus;
  unresolvedOnly?: boolean; sort?: 'newest' | 'popular' | 'value';
  page?: number; size?: number;
}
export interface PostPage { items: PostDto[]; page: number; size: number; total: number; }
