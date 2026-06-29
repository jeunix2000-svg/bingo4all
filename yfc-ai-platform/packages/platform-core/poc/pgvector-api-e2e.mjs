// poc/pgvector-api-e2e.mjs
// 端到端：ApiEmbeddingProvider（実HTTP fetch）→ 真pgvector 検索。
// 検証点: ①実HTTP埋め込み呼び出し ②Bearer認証 ③次元検証 ④<=>コサイン+SQL機密フィルタ ⑤recall
// 実行は run-api-e2e.py が行う（mock埋め込みサーバ + Postgres を起動して env を注入）。
import pg from 'pg';
import { ApiEmbeddingProvider, apiEmbeddingFromEnv } from '../src/providers/apiEmbeddingProvider.ts';

const DIM = Number(process.env.EMBEDDING_DIM ?? 10);

const CHUNKS = [
  ['K1','INTERNAL',null,'COBOLからJavaへのマイグレーション手順。固定長レコードとデータ移植の注意点。'],
  ['K2','INTERNAL',null,'JCLのジョブが異常終了。リターンコードRC=12の調査と対処の事例。'],
  ['K3','INTERNAL',null,'Entra IDによるシングルサインオン設定手順。OIDCの認証フロー。'],
  ['K4','INTERNAL',null,'PostgreSQLのクエリが遅い。インデックス設計とチューニングでレイテンシ改善。'],
  ['K5','INTERNAL',null,'リリースのCI/CDパイプライン構築。GitHub Actionsからのデプロイ自動化。'],
  ['K6','INTERNAL',null,'データベースの暗号化と脆弱性対応。保存時暗号化のセキュリティ設定。'],
  ['K7','INTERNAL',null,'ユニットテストと結合試験の品質基準。カバレッジの検証方針。'],
  ['K8','INTERNAL',null,'レガシーシステムのリプレース計画。コボル資産の段階的な移植戦略。'],
  ['K9','INTERNAL',null,'ログインができない障害。SSOトークンの期限切れが原因のケース。'],
  ['K10','INTERNAL',null,'SQLのパフォーマンスが悪い時のクエリチューニング実例。'],
  ['K11','DEPT','finance','金融部門のジョブ制御運用ルール。夜間バッチのJCL標準。'],
  ['K12','CONFIDENTIAL',null,'役員人事と報酬に関する機密メモ。取扱注意。'],
];
const QUERIES = [
  ['レガシー言語の入れ替え作業の注意点', ['K1','K8'], true],
  ['バッチのジョブ制御が障害で停止した', ['K2'], true],
  ['SSOのサインオン手順を知りたい', ['K3','K9'], true],
  ['DBが重いときの改善方法', ['K4','K10'], true],
  ['本番への自動リリース', ['K5'], false],
  ['暗号化によるセキュリティ対策', ['K6'], false],
  ['コボル資産の移植戦略', ['K8','K1'], false],
  ['ログイン障害の原因調査', ['K9'], false],
];
const TOPK = 3;
const lit = v => '[' + v.map(x => x.toFixed(6)).join(',') + ']';

let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { fail++; console.log('  FAIL', m); } };

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const provider = apiEmbeddingFromEnv();   // EMBEDDING_ENDPOINT/API_KEY/MODEL/DIM から構成（実HTTP）

try {
  console.log(`\n[api-e2e] ApiEmbeddingProvider(endpoint=${process.env.EMBEDDING_ENDPOINT}) → 真pgvector`);

  // ① 認証拒否（空キー）→ providerが例外
  let authRejected = false;
  try {
    const noKey = new ApiEmbeddingProvider({ endpoint: process.env.EMBEDDING_ENDPOINT, apiKey: '', model: 'mock', dimension: DIM });
    await noKey.embed(['test']);
  } catch { authRejected = true; }
  check(authRejected, 'Bearer未指定はAPIが401→providerが例外（認証ハンドリング）');

  // ② 実HTTPで埋め込み取得（次元検証込み）
  const texts = CHUNKS.map(c => c[3]);
  const vecs = await provider.embed(texts);
  check(vecs.length === CHUNKS.length && vecs[0].length === DIM, `実HTTP埋め込み取得 ${vecs.length}件 × dim${DIM}`);

  // ③ 真pgvectorに格納
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  await pool.query('CREATE SCHEMA IF NOT EXISTS platform');
  await pool.query(`CREATE TABLE platform.knowledge_chunk (id text primary key, confidentiality text, department text, chunk_text text, embedding vector(${DIM}))`);
  for (let i = 0; i < CHUNKS.length; i++) {
    const [id, conf, dept, text] = CHUNKS[i];
    await pool.query('INSERT INTO platform.knowledge_chunk VALUES ($1,$2,$3,$4,$5)', [id, conf, dept, text, lit(vecs[i])]);
  }
  await pool.query('CREATE INDEX ON platform.knowledge_chunk USING hnsw (embedding vector_cosine_ops)');

  // ④ クエリも実HTTPで埋め込み → <=> + SQL機密フィルタで検索 → recall
  let recallSum = 0, mrrSum = 0;
  const qvecs = await provider.embed(QUERIES.map(q => q[0]));
  for (let i = 0; i < QUERIES.length; i++) {
    const [q, relevant] = QUERIES[i];
    const { rows } = await pool.query(
      `SELECT id FROM platform.knowledge_chunk
       WHERE confidentiality = ANY($1) ORDER BY embedding <=> $2 LIMIT ${TOPK}`,
      [['PUBLIC', 'INTERNAL'], lit(qvecs[i])]);
    const top = rows.map(r => r.id);
    const hit = relevant.filter(id => top.includes(id)).length;
    recallSum += hit / relevant.length;
    mrrSum += (() => { for (let k = 0; k < top.length; k++) if (relevant.includes(top[k])) return 1 / (k + 1); return 0; })();
  }
  const recall = recallSum / QUERIES.length, mrr = mrrSum / QUERIES.length;
  console.log(`  recall@${TOPK}=${recall.toFixed(3)}  MRR=${mrr.toFixed(3)}`);
  check(recall >= 0.8, `語義召回 recall@${TOPK} ≥ 0.8`);

  // ⑤ 機密フィルタ（SQL）
  const { rows: leak } = await pool.query(
    `SELECT id FROM platform.knowledge_chunk WHERE confidentiality = ANY($1) ORDER BY embedding <=> $2 LIMIT 5`,
    [['PUBLIC', 'INTERNAL'], lit((await provider.embed(['役員 人事 報酬 機密']))[0])]);
  check(!leak.some(r => r.id === 'K12'), 'CONFIDENTIAL(K12) はSQLで遮断');

} catch (e) {
  fail++; console.log('  FAIL exception:', e.message);
} finally {
  await pool.end();
}
console.log(`\n[api-e2e] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
