// poc/mock-embeddings-server.mjs
// OpenAI互換の埋め込みAPIのローカルmock（真実HTTPサーバ）。
// ApiEmbeddingProvider のHTTP結線（Bearer認証・レスポンス形・次元）を実環境同型で検証するためのもの。
// ※ これは「埋め込みモデル」ではなく、語義構造を持つ決定論ベクトルを返す代替。
//   本番は EMBEDDING_ENDPOINT を実プロバイダ（OpenAI/Voyage等）に向けるだけでよい（コード変更不要）。
import http from 'node:http';

const SYNONYM_GROUPS = [
  ['移行','マイグレーション','リプレース','移植'],['COBOL','コボル','レガシー'],
  ['エラー','異常','RC','リターンコード','障害'],['JCL','ジョブ','ジョブ制御'],
  ['認証','SSO','ログイン','Entra','シングルサインオン'],['性能','パフォーマンス','遅い','チューニング','レイテンシ'],
  ['データベース','DB','SQL','PostgreSQL','クエリ'],['セキュリティ','機密','暗号化','脆弱性'],
  ['テスト','試験','検証','品質'],['デプロイ','リリース','CI','CD','パイプライン'],
];
const DIM = SYNONYM_GROUPS.length;
function embed(text) {
  const v = SYNONYM_GROUPS.map(g => g.reduce((c, t) => c + text.split(t).length - 1, 0));
  const n = Math.hypot(...v) || 1;
  return v.map(x => x / n);
}

const PORT = Number(process.env.MOCK_PORT ?? 8099);
http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.endsWith('/v1/embeddings')) {
    res.writeHead(404).end('not found'); return;
  }
  // Bearer 認証（OpenAI互換）。未指定/空は401。
  const auth = req.headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) { res.writeHead(401, { 'content-type': 'application/json' })
    .end(JSON.stringify({ error: { message: 'missing api key', type: 'auth' } })); return; }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const { input, model } = JSON.parse(body);
      const arr = Array.isArray(input) ? input : [input];
      const data = arr.map((text, i) => ({ object: 'embedding', index: i, embedding: embed(String(text)) }));
      res.writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ object: 'list', model: model ?? 'mock', data, usage: { total_tokens: 0 } }));
    } catch (e) {
      res.writeHead(400, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: { message: String(e) } }));
    }
  });
}).listen(PORT, () => console.error(`[mock-embeddings] :${PORT}/v1/embeddings dim=${DIM}`));
