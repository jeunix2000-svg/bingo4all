// platform-core/src/ragEngine.ts
// RAG 能力。Embedding → VectorStore → LLM を束ねる。機密はフィルタ後のみ投入。
import type { Confidentiality, ScoredChunk } from './types.js';

export interface RagRequest {
  question: string;
  allowedConfidentiality: Confidentiality[];
  departmentScope?: string | null;
}
export interface RagAnswer {
  answer: string;
  citations: ScoredChunk[];
  relatedKnowledgeIds: string[];
}
export interface RagEngine {
  ask(req: RagRequest): Promise<RagAnswer>;
}
