# pgvector PoC — 語義検索の召回検証（Phase 2）

Wikiの全文検索を**意味検索（Vector/RAG）**へ進化させる前提技術を検証する。

## 何を証明したか（`node evaluate.mjs`）
- **語義召回 recall@3 = 1.000 / MRR = 1.000**（同義語のみのhardクエリでも命中）
- **キーワード基線 recall@3 = 0.813** に対し **+19pt** の改善
  - 例「DBが重いときの改善」: Vector 1.00 / Keyword 0.00（重い↔遅い・DB↔PostgreSQL を語彙一致では引けない）
- **機密/部門フィルタの実証**：CONFIDENTIAL・他部門DEPTは検索結果に出ない（RAG投入前に遮断）

## 実行
```bash
node packages/platform-core/poc/evaluate.mjs    # 召回評価（PASSで exit 0）
```

## 構成
| ファイル | 役割 |
|---|---|
| `embedding.mjs` | 決定論的な概念埋め込み（同義語を同一次元へ。本番はClaude/埋め込みモデルに差替） |
| `vectorStore.mjs` | コサイン近傍探索（pgvector `vector_cosine_ops` と等価）＋機密フィルタ・キーワード基線 |
| `corpus.mjs` | 社内ナレッジ12件＋ラベル付きクエリ8件 |
| `evaluate.mjs` | recall@k / MRR 評価・基線比較・機密遮断の実証 |
| `pgvector_queries.sql` | 本番のpgvector検索SQL（生産ターゲット） |


## 真実pgvectorでの検証（`run-pgvector-eval.py`）
JS等価実装に加え、**実際のPostgreSQL + pgvector** に対しても検証済み：
```bash
python3 packages/platform-core/poc/run-pgvector-eval.py
# => recall@3 = 1.000 / MRR = 1.000 / 機密K12・部門K11 を SQL WHERE で遮断 / PASS
```
`<=>`（コサイン距離）と HNSW インデックス、SQL内の機密フィルタを実DBで実行する。

## 本番の埋め込み（確定論的 → 実モデル）
本番は `platform-core/src/providers/apiEmbeddingProvider.ts`（OpenAI互換/Voyage 等）で
実モデルのベクトルを生成し、**同じ knowledge_chunk テーブルと同じSQL**で検索する。
環境変数 `EMBEDDING_ENDPOINT / EMBEDDING_API_KEY / EMBEDDING_MODEL / EMBEDDING_DIM` で構成。
（サンドボックスは外部API非到達のため、評価は確定論的埋め込みで実施。検索系は実pgvector。）


## ApiEmbeddingProvider 実HTTP 端到端（`run-api-e2e.py`）
実プロバイダ鍵・外部APIを使わず、**ローカルの OpenAI互換 embeddings mock** に対して
`ApiEmbeddingProvider` の実HTTP結線（fetch・Bearer認証・次元検証・エラー処理）を検証し、
取得ベクトルを**真pgvector**に格納して `<=>`+SQL機密フィルタで検索する。
```bash
python3 packages/platform-core/poc/run-api-e2e.py
# => Bearer未指定は401→provider例外 / 実HTTP 12件×dim10 / recall@3=1.0 / K12遮断 / pass=4
```
**本番への切替（コード変更不要）**：環境変数を実プロバイダに向けるだけ。
```bash
export EMBEDDING_ENDPOINT=https://api.openai.com/v1/embeddings   # or Voyage 等
export EMBEDDING_API_KEY=***   # 鍵はコード/ログに残さず環境変数で注入
export EMBEDDING_MODEL=text-embedding-3-small
export EMBEDDING_DIM=1536      # DBの vector(N) と一致させる
```
`mock-embeddings-server.mjs` はローカル検証専用のmock（語義構造を持つ決定論ベクトルを返す）。

## サンドボックスと本番の差異
本PoCのサンドボックスPostgreSQLには pgvector 拡張が無いため、検索ランキングは
`vectorStore.mjs`（コサイン）で**等価再現**している。本番（Azure PostgreSQL Flexible Server）では
`CREATE EXTENSION vector;`（V3移行）と Embeddingモデルにより同じ検索を実行する。
プラットフォーム能力IFは `platform-core/src/{embedding,vectorStore,ragEngine}.ts` に定義済み。

## 次の一手（本実装）
1. Embedding を実モデルに差替（platform-core の `EmbeddingProvider` 実装）。
2. WikiのpublishフックでchunkをUpsert（記事公開→ベクトル化）。
3. RAG Engineで「権限フィルタ済み候補→Claude生成→出典付き回答」。
