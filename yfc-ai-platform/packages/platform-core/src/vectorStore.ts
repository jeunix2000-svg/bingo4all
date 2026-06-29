// platform-core/src/vectorStore.ts
// Vector DB 能力（PostgreSQL + pgvector を既定実装とする）。
import type { KnowledgeChunk, ScoredChunk, Confidentiality } from './types.js';

export interface VectorQuery {
  embedding: number[];
  topK: number;
  // 権限/機密フィルタ（RAGに投入する前に必ず適用）
  allowedConfidentiality: Confidentiality[];
  departmentScope?: string | null;
}
export interface VectorStore {
  upsert(chunks: KnowledgeChunk[], embeddings: number[][]): Promise<void>;
  search(query: VectorQuery): Promise<ScoredChunk[]>;
}
