// platform-core/src/embedding.ts
// Embedding 能力のインターフェース。実装は Claude/埋め込みモデルで差し替え可能。
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  readonly dimension: number;
}
