// platform-core/src/providers/apiEmbeddingProvider.ts
// 本番用 EmbeddingProvider。OpenAI互換 / Voyage 等の埋め込みAPIを呼び、確定論的埋め込みを置き換える。
// 機密区分=機密/部門限 の本文は呼び出し前にフィルタすること（STRIDE / Gateway規約）。
import type { EmbeddingProvider } from '../embedding.js';

export interface ApiEmbeddingConfig {
  endpoint: string;          // 例: https://api.openai.com/v1/embeddings, https://api.voyageai.com/v1/embeddings
  apiKey: string;            // 環境変数から注入（コードに埋め込まない）
  model: string;             // 例: text-embedding-3-small / voyage-3
  dimension: number;         // 例: 1536 / 1024（DBの vector(N) と一致させる）
  inputField?: string;       // 既定 'input'（OpenAI互換）。Voyageは 'input'
}

export class ApiEmbeddingProvider implements EmbeddingProvider {
  readonly dimension: number;
  constructor(private cfg: ApiEmbeddingConfig) { this.dimension = cfg.dimension; }

  async embed(texts: string[]): Promise<number[][]> {
    const body: Record<string, unknown> = { model: this.cfg.model };
    body[this.cfg.inputField ?? 'input'] = texts;
    const res = await fetch(this.cfg.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`embedding API error ${res.status}: ${await res.text()}`);
    const json = await res.json() as { data: { embedding: number[] }[] };
    const vectors = json.data.map(d => d.embedding);
    if (vectors[0]?.length !== this.dimension)
      throw new Error(`dimension mismatch: got ${vectors[0]?.length}, expected ${this.dimension}`);
    return vectors;
  }
}

// 環境変数からの組み立てヘルパ
export function apiEmbeddingFromEnv(): ApiEmbeddingProvider {
  return new ApiEmbeddingProvider({
    endpoint: process.env.EMBEDDING_ENDPOINT ?? 'https://api.openai.com/v1/embeddings',
    apiKey: process.env.EMBEDDING_API_KEY ?? '',
    model: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
    dimension: Number(process.env.EMBEDDING_DIM ?? 1536),
  });
}
