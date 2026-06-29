// scripts/smoke.mjs — 端到端冒烟（真実DB）。DATABASE_URL のPostgresに対しHTTPでフルフロー検証。
// 実行（docker使用時）: docker compose up -d db && npm run db:migrate && node --import tsx packages/wiki-module/scripts/smoke.mjs
import pg from 'pg';
import { buildApp } from '../src/app.ts';
import { PgPostRepository } from '../src/modules/posts/pg.repository.ts';
import { PgVoteRepository } from '../src/modules/votes/pg.voteRepository.ts';
import { PgRatingRepository } from '../src/modules/ratings/pg.ratingRepository.ts';
import { PgContributionRepository } from '../src/modules/contributions/pg.contributionRepository.ts';
import { DirectPointsClient } from '../src/shared/pointsClient.ts';
// @ts-ignore
import { AwardPointsUseCase } from '../../point-service/src/application/awardPoints.js';
// @ts-ignore
import { LedgerRepository as PgLedgerRepository } from '../../point-service/src/infrastructure/pgLedgerRepository.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const ledger = new PgLedgerRepository(pool);
const award = new AwardPointsUseCase(ledger);
const app = buildApp({
  posts: new PgPostRepository(pool), votes: new PgVoteRepository(pool),
  ratings: new PgRatingRepository(pool), contributions: new PgContributionRepository(pool),
  points: new DirectPointsClient(award),
});

const USERS = { author:'田中', voterB:'鈴木', answerer:'佐藤', asker:'山田', capRater:'高橋' };
const UID = { author:'00000000-0000-0000-0000-000000000001', voterB:'00000000-0000-0000-0000-000000000002',
  answerer:'00000000-0000-0000-0000-000000000003', asker:'00000000-0000-0000-0000-000000000004',
  capRater:'00000000-0000-0000-0000-000000000005' };
function uid(name){ return UID[name]; }

let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };

const server = app.listen(0);
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
const H = (id, role='EMPLOYEE') => ({ 'x-user-id': id, 'x-user-role': role, 'content-type': 'application/json' });
const POST = (p, h, b) => fetch(base+p, { method:'POST', headers:h, ...(b?{body:JSON.stringify(b)}:{}) });
const newPost = () => ({ title:'Q: JCL RC', categoryCode:'LEGACY', postType:'QUESTION', summary:'s', body:'b', confidentiality:'INTERNAL' });

try {
  // seed users referenced by FK (author + voter + answerer)
  for (const [id, name] of Object.entries(USERS))
    await pool.query(`INSERT INTO wiki.app_user(id, entra_oid, email, display_name, user_type)
      VALUES ($1,$2,$2||'@yfc.co.jp',$3,'EMPLOYEE') ON CONFLICT DO NOTHING`, [uid(id), id, name]);

  console.log('\n[smoke] 真実DBに対する端到端フロー');
  // health
  check((await (await fetch(base+'/health')).json()).status === 'ok', 'health=ok');

  // create post → +5 to author (DB)
  const pr = await POST('/api/v1/posts', H(uid('author')), newPost());
  const p = await pr.json();
  if (!p.id) console.log('    >> create resp', pr.status, JSON.stringify(p));
  check(!!p.id, 'POST /posts → 作成');
  check(await bal(uid('author')) === 5, '投稿作成で著者 +5（DB記帳）');

  // other upvote → +1
  const v = await POST(`/api/v1/posts/${p.id}/votes`, H(uid('voterB')), { direction: 1 });
  check(v.status === 201, 'いいね 201');
  check(await bal(uid('author')) === 6, 'いいねで著者 +1（合計6）');

  // self-vote rejected by DB trigger
  const sv = await POST(`/api/v1/posts/${p.id}/votes`, H(uid('author')), { direction: 1 });
  check(sv.status === 403, '自票は403（DBトリガ）');

  // upvote_count in DB
  const cnt = (await pool.query('SELECT upvote_count FROM wiki.post WHERE id=$1', [p.id])).rows[0].upvote_count;
  check(cnt === 1, `post.upvote_count=1（実DB値=${cnt}）`);

  // rating → rater +1
  await POST(`/api/v1/posts/${p.id}/ratings`, H(uid('voterB')), { usefulness:5, accuracy:4, novelty:3 });
  check(await bal(uid('voterB')) === 1, '評価で評価者 +1');

  // 日次上限（5回）を真実DBで検証：同一評価者が6投稿を評価 → +5で頭打ち、6回目も201
  const ratedPosts = [];
  for (let i = 0; i < 6; i++)
    ratedPosts.push((await (await POST('/api/v1/posts', H(uid('asker')), newPost())).json()).id);
  let last201 = false;
  for (const pid of ratedPosts) {
    const rr = await POST(`/api/v1/posts/${pid}/ratings`, H(uid('capRater')), { usefulness:4, accuracy:4, novelty:4 });
    last201 = rr.status === 201;
  }
  check(last201, '6回目の評価もHTTP 201（上限超過は積分のみ非加算）');
  check(await bal(uid('capRater')) === 5, '日次上限により評価者は +5 で頭打ち（DB実測）');

  // contribution + accept → answerer +15, post author +20
  const c = await (await POST(`/api/v1/posts/${p.id}/contributions`, H(uid('answerer')), { kind:'ANSWER', body:'A' })).json();
  check(await bal(uid('answerer')) === 3, '回答作成で +3');
  const acc = await POST(`/api/v1/contributions/${c.id}/accept`, H(uid('author')));  // 質問者=author が採択
  check(acc.status === 200, '採択 200');
  check(await bal(uid('answerer')) === 18, '採択で回答者 +15（合計18）');
  check(await bal(uid('author')) === 6 + 20, 'ベストアンサーで投稿者 +20');

  // ledger rows exist in real DB
  const events = (await pool.query('SELECT count(*)::int c FROM points.point_event')).rows[0].c;
  check(events >= 5, `point_event 行数=${events}（追加専用台帳）`);

} catch (e) {
  fail++; console.log('  FAIL exception:', e.message);
} finally {
  server.close(); await pool.end();
}

console.log(`\n[smoke] pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);

async function bal(uid){ return ledger.getBalance(uid); }
