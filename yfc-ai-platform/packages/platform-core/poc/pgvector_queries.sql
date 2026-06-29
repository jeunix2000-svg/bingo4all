-- pgvector_queries.sql — 本番（Azure PostgreSQL + pgvector）での語義検索クエリ。
-- スキーマは db/migrations/V3__platform_pgvector.sql を参照。
-- 本PoCのインメモリ実装(vectorStore.mjs)は、この vector_cosine_ops と等価のランキングを再現している。

-- 1) 取り込み：Embeddingモデルで生成したベクトルを保存
-- INSERT INTO platform.knowledge_chunk(source_module, source_ref, chunk_text, confidentiality, department, embedding)
-- VALUES ('wiki', :postId, :text, :conf, :dept, :embedding);

-- 2) 語義検索（コサイン近傍 + 権限/機密フィルタ）
--    :q_embedding は質問文をEmbeddingしたベクトル。<=> はコサイン距離（小さいほど類似）。
SELECT id, chunk_text, confidentiality,
       1 - (embedding <=> :q_embedding) AS score      -- コサイン類似度
FROM platform.knowledge_chunk
WHERE confidentiality = ANY(:allowed_confidentiality)   -- 例: ARRAY['PUBLIC','INTERNAL']
  AND (confidentiality <> 'DEPT' OR department = :dept_scope)
ORDER BY embedding <=> :q_embedding                     -- HNSWインデックスで近傍探索
LIMIT :top_k;

-- 3) 近傍インデックス（V3移行で作成済み）
-- CREATE INDEX idx_chunk_embedding ON platform.knowledge_chunk
--   USING hnsw (embedding vector_cosine_ops);
