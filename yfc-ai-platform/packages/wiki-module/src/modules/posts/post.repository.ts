// wiki-module/src/modules/posts/post.repository.ts  (Repository層インターフェース)
import type { PostCreateDto, PostUpdateDto, PostDto, PostDetailDto, PostListQuery, PostPage, PostStatus } from './post.dto.js';

export interface PostRepository {
  create(authorId: string, dto: PostCreateDto): Promise<PostDetailDto>;
  findById(id: string): Promise<PostDetailDto | null>;
  list(query: PostListQuery): Promise<PostPage>;
  update(id: string, dto: PostUpdateDto): Promise<PostDetailDto>;
  setStatus(id: string, status: PostStatus): Promise<PostDetailDto>;
  softDelete(id: string): Promise<void>;
}
