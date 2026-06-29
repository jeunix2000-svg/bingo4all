// poc/embedding.mjs
// 決定論的な「概念埋め込み」。同義語を同一次元に写像し、語彙が違っても意味が近ければベクトルが近づく。
// 本番は EmbeddingProvider を Claude/埋め込みモデルに差し替える（platform-core/src/embedding.ts）。
export const SYNONYM_GROUPS = [
  ['移行', 'マイグレーション', 'リプレース', '移植'],            // migration
  ['COBOL', 'コボル', 'レガシー'],                              // cobol
  ['エラー', '異常', 'RC', 'リターンコード', '障害'],            // error
  ['JCL', 'ジョブ', 'ジョブ制御'],                              // jcl
  ['認証', 'SSO', 'ログイン', 'Entra', 'シングルサインオン'],    // auth
  ['性能', 'パフォーマンス', '遅い', 'チューニング', 'レイテンシ'],// perf
  ['データベース', 'DB', 'SQL', 'PostgreSQL', 'クエリ'],         // db
  ['セキュリティ', '機密', '暗号化', '脆弱性'],                  // security
  ['テスト', '試験', '検証', '品質'],                           // test
  ['デプロイ', 'リリース', 'CI', 'CD', 'パイプライン'],          // deploy
];

export const DIM = SYNONYM_GROUPS.length;

export function embed(text) {
  const v = new Array(DIM).fill(0);
  SYNONYM_GROUPS.forEach((group, i) => {
    for (const term of group) {
      // 出現回数をカウント（部分一致）
      let idx = 0, count = 0;
      while ((idx = text.indexOf(term, idx)) !== -1) { count++; idx += term.length; }
      v[i] += count;
    }
  });
  return l2normalize(v);
}

export function l2normalize(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / n);
}
export function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // 既にL2正規化済みなので内積=コサイン類似度
}
