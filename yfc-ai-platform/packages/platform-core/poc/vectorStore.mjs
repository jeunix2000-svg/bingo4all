// poc/vectorStore.mjs
// pgvector の vector_cosine_ops 近傍探索と等価のインメモリ実装。
// 重要：RAGに渡す前に必ず権限/機密フィルタを適用する（プラットフォーム不変条件）。
import { embed, cosine } from './embedding.mjs';

const CONF_RANK = { PUBLIC: 0, INTERNAL: 1, DEPT: 2, CONFIDENTIAL: 3 };

export class InMemoryVectorStore {
  constructor() { this.rows = []; }
  upsert(chunks) {
    for (const c of chunks) this.rows.push({ ...c, embedding: embed(c.text) });
  }
  // query: { text, topK, allowedConfidentiality:[], departmentScope }
  search(query) {
    const qv = embed(query.text);
    const allowed = new Set(query.allowedConfidentiality);
    return this.rows
      .filter(r => allowed.has(r.confidentiality))                                  // 機密フィルタ
      .filter(r => r.confidentiality !== 'DEPT' || r.department === query.departmentScope) // 部門フィルタ
      .map(r => ({ id: r.id, text: r.text, confidentiality: r.confidentiality, score: cosine(qv, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK ?? 5);
  }
}

// 比較用：キーワード（完全一致トークン）ベースライン
export class KeywordStore {
  constructor(vocab) { this.rows = []; this.vocab = vocab; }
  upsert(chunks) { for (const c of chunks) this.rows.push(c); }
  tokens(t) { return this.vocab.filter(w => t.includes(w)); }
  search(query) {
    const allowed = new Set(query.allowedConfidentiality);
    const qt = new Set(this.tokens(query.text));
    return this.rows
      .filter(r => allowed.has(r.confidentiality))
      .map(r => { const rt = this.tokens(r.text); const overlap = rt.filter(w => qt.has(w)).length;
                  return { id: r.id, text: r.text, score: overlap }; })
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK ?? 5);
  }
}
