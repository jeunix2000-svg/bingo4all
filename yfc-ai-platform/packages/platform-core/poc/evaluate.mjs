// poc/evaluate.mjs — 語義検索の召回（recall@k / MRR）を評価し、キーワード基線と比較する。
// 実行: node evaluate.mjs
import { InMemoryVectorStore, KeywordStore } from './vectorStore.mjs';
import { CHUNKS, QUERIES, SYNONYM_GROUPS } from './corpus.mjs';

const VOCAB = SYNONYM_GROUPS.flat();
const TOPK = 3;

const vec = new InMemoryVectorStore(); vec.upsert(CHUNKS);
const kw = new KeywordStore(VOCAB); kw.upsert(CHUNKS);

function recallAt(results, relevant, k) {
  const top = results.slice(0, k).map(r => r.id);
  const hit = relevant.filter(id => top.includes(id)).length;
  return hit / relevant.length;
}
function rr(results, relevant) {
  for (let i = 0; i < results.length; i++) if (relevant.includes(results[i].id)) return 1 / (i + 1);
  return 0;
}

function evalStore(store, label) {
  let recallSum = 0, mrrSum = 0;
  const rows = [];
  for (const { q, relevant } of QUERIES) {
    const res = store.search({ text: q, topK: TOPK, allowedConfidentiality: ['PUBLIC', 'INTERNAL'] });
    const r = recallAt(res, relevant, TOPK);
    const m = rr(res, relevant);
    recallSum += r; mrrSum += m;
    rows.push({ q, top: res.slice(0, TOPK).map(x => x.id).join(','), recall: r.toFixed(2) });
  }
  return { label, recall: (recallSum / QUERIES.length), mrr: (mrrSum / QUERIES.length), rows };
}

const V = evalStore(vec, 'Vector(semantic)');
const K = evalStore(kw, 'Keyword(baseline)');

console.log('=== 語義検索 PoC 召回評価（topK=' + TOPK + ', N=' + QUERIES.length + '） ===\n');
console.log('クエリ別（V=Vector / K=Keyword の recall@3）:');
for (let i = 0; i < V.rows.length; i++) {
  const v = V.rows[i], k = K.rows[i];
  const tag = QUERIES[i].hard ? '[hard]' : '      ';
  console.log(`  ${tag} V=${v.recall} K=${k.recall}  V上位[${v.top}]  ${v.q}`);
}
console.log('\n--- 指標比較 ---');
console.log(`  Vector(semantic):  recall@${TOPK}=${V.recall.toFixed(3)}  MRR=${V.mrr.toFixed(3)}`);
console.log(`  Keyword(baseline): recall@${TOPK}=${K.recall.toFixed(3)}  MRR=${K.mrr.toFixed(3)}`);
console.log(`  改善: recall +${((V.recall - K.recall) * 100).toFixed(0)}pt / MRR +${((V.mrr - K.mrr) * 100).toFixed(0)}pt`);

// 機密フィルタの実証：権限のない利用者にCONFIDENTIAL/DEPTは返らない
console.log('\n--- 機密フィルタ実証 ---');
const leak = vec.search({ text: '役員 人事 報酬 機密', topK: 5, allowedConfidentiality: ['PUBLIC', 'INTERNAL'] });
const leaked = leak.some(r => r.id === 'K12');
console.log(`  一般社員の検索にK12(CONFIDENTIAL)が出る: ${leaked}  => ${leaked ? 'NG(漏えい)' : 'OK(遮断)'}`);
const deptMiss = vec.search({ text: '夜間バッチ ジョブ制御', topK: 5, allowedConfidentiality: ['PUBLIC', 'INTERNAL', 'DEPT'], departmentScope: 'sales' });
const deptLeaked = deptMiss.some(r => r.id === 'K11');
console.log(`  sales部門の検索にK11(finance DEPT)が出る: ${deptLeaked}  => ${deptLeaked ? 'NG' : 'OK(部門遮断)'}`);

// 合否
const pass = V.recall >= 0.8 && V.recall > K.recall && !leaked && !deptLeaked;
console.log('\n=== PoC 判定: ' + (pass ? 'PASS ✅（語義召回≥0.8・基線超過・機密遮断）' : 'FAIL') + ' ===');
process.exit(pass ? 0 : 1);
