-- V3__platform_pgvector.sql — AI Knowledge Platform 基盤（Phase 2）
-- Wikiは最初の知識供給モジュール。将来の全AI応用が同じ knowledge_chunk を共有する。
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE platform.knowledge_chunk (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module   TEXT NOT NULL DEFAULT 'wiki',     -- 'wiki' / 'sales-report' / 'recruit' ...
  source_ref      TEXT NOT NULL,                    -- 例: post.id
  chunk_text      TEXT NOT NULL,
  confidentiality TEXT NOT NULL DEFAULT 'INTERNAL'
                   CHECK (confidentiality IN ('PUBLIC','INTERNAL','DEPT','CONFIDENTIAL')),
  department      TEXT,
  embedding       vector(1024),                     -- 埋め込み次元はモデルに合わせ調整
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 近傍探索インデックス（HNSW）。権限/機密フィルタは検索クエリ側で必ず適用。
CREATE INDEX idx_chunk_embedding ON platform.knowledge_chunk
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chunk_conf ON platform.knowledge_chunk(confidentiality, department);

-- Prompt Library（Prompt Catalog の実体・バージョン管理）
CREATE TABLE platform.prompt_template (
  key         TEXT NOT NULL,
  version     TEXT NOT NULL,
  template    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, version)
);
