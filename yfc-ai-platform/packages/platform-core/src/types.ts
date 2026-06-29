// platform-core/src/types.ts — プラットフォーム共通型
export type Confidentiality = 'PUBLIC' | 'INTERNAL' | 'DEPT' | 'CONFIDENTIAL';

export interface KnowledgeChunk {
  id: string;
  sourceModule: string;   // 'wiki' など。Wikiは最初の供給モジュール
  text: string;
  confidentiality: Confidentiality;
  metadata?: Record<string, unknown>;
}
export interface ScoredChunk extends KnowledgeChunk { score: number; }
