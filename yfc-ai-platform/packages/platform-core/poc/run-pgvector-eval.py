#!/usr/bin/env python3
# poc/run-pgvector-eval.py
# 「真実のpgvector」に対する語義検索の召回評価。
#   - platform.knowledge_chunk(vector) に埋め込みを格納
#   - クエリは pgvector の <=> (コサイン距離) + SQL内の機密フィルタで検索
#   - recall@k / MRR を計測し、確定論的埋め込み（サンドボックス）でも語義召回を確認
# 本番は埋め込みを ApiEmbeddingProvider（実モデル）に差し替え、同じSQLで検索する。
import pgserver, tempfile

# --- 同義語グループ（corpus.mjs / embedding.mjs と同一。本番は実モデルembeddingに置換）---
SYNONYM_GROUPS = [
    ['移行', 'マイグレーション', 'リプレース', '移植'],
    ['COBOL', 'コボル', 'レガシー'],
    ['エラー', '異常', 'RC', 'リターンコード', '障害'],
    ['JCL', 'ジョブ', 'ジョブ制御'],
    ['認証', 'SSO', 'ログイン', 'Entra', 'シングルサインオン'],
    ['性能', 'パフォーマンス', '遅い', 'チューニング', 'レイテンシ'],
    ['データベース', 'DB', 'SQL', 'PostgreSQL', 'クエリ'],
    ['セキュリティ', '機密', '暗号化', '脆弱性'],
    ['テスト', '試験', '検証', '品質'],
    ['デプロイ', 'リリース', 'CI', 'CD', 'パイプライン'],
]
DIM = len(SYNONYM_GROUPS)

def embed(text):
    v = [0.0] * DIM
    for i, group in enumerate(SYNONYM_GROUPS):
        for term in group:
            v[i] += text.count(term)
    n = sum(x * x for x in v) ** 0.5 or 1.0
    return [x / n for x in v]

def vec_literal(v):
    return '[' + ','.join(f'{x:.6f}' for x in v) + ']'

CHUNKS = [
    ('K1','INTERNAL',None,'COBOLからJavaへのマイグレーション手順。固定長レコードとデータ移植の注意点。'),
    ('K2','INTERNAL',None,'JCLのジョブが異常終了。リターンコードRC=12の調査と対処の事例。'),
    ('K3','INTERNAL',None,'Entra IDによるシングルサインオン設定手順。OIDCの認証フロー。'),
    ('K4','INTERNAL',None,'PostgreSQLのクエリが遅い。インデックス設計とチューニングでレイテンシ改善。'),
    ('K5','INTERNAL',None,'リリースのCI/CDパイプライン構築。GitHub Actionsからのデプロイ自動化。'),
    ('K6','INTERNAL',None,'データベースの暗号化と脆弱性対応。保存時暗号化のセキュリティ設定。'),
    ('K7','INTERNAL',None,'ユニットテストと結合試験の品質基準。カバレッジの検証方針。'),
    ('K8','INTERNAL',None,'レガシーシステムのリプレース計画。コボル資産の段階的な移植戦略。'),
    ('K9','INTERNAL',None,'ログインができない障害。SSOトークンの期限切れが原因のケース。'),
    ('K10','INTERNAL',None,'SQLのパフォーマンスが悪い時のクエリチューニング実例。'),
    ('K11','DEPT','finance','金融部門のジョブ制御運用ルール。夜間バッチのJCL標準。'),
    ('K12','CONFIDENTIAL',None,'役員人事と報酬に関する機密メモ。取扱注意。'),
]
QUERIES = [
    ('レガシー言語の入れ替え作業の注意点', ['K1', 'K8'], True),
    ('バッチのジョブ制御が障害で停止した', ['K2'], True),
    ('SSOのサインオン手順を知りたい', ['K3', 'K9'], True),
    ('DBが重いときの改善方法', ['K4', 'K10'], True),
    ('本番への自動リリース', ['K5'], False),
    ('暗号化によるセキュリティ対策', ['K6'], False),
    ('コボル資産の移植戦略', ['K8', 'K1'], False),
    ('ログイン障害の原因調査', ['K9'], False),
]
TOPK = 3

def main():
    srv = pgserver.get_server(tempfile.mkdtemp())
    srv.psql('CREATE EXTENSION IF NOT EXISTS vector;')
    srv.psql('CREATE SCHEMA IF NOT EXISTS platform;')
    srv.psql(f'''CREATE TABLE platform.knowledge_chunk (
        id text PRIMARY KEY, confidentiality text NOT NULL, department text,
        chunk_text text NOT NULL, embedding vector({DIM}));''')
    # 取り込み（本番は ApiEmbeddingProvider のベクトルを格納）
    for cid, conf, dept, text in CHUNKS:
        srv.psql("INSERT INTO platform.knowledge_chunk VALUES (%s,%s,%s,%s,%s);" % (
            _q(cid), _q(conf), 'NULL' if dept is None else _q(dept), _q(text), _q(vec_literal(embed(text)))))
    srv.psql(f'CREATE INDEX ON platform.knowledge_chunk USING hnsw (embedding vector_cosine_ops);')

    print(f'=== 真実pgvectorによる語義検索 召回評価（topK={TOPK}, N={len(QUERIES)}） ===\n')
    recall_sum = mrr_sum = 0.0
    for q, relevant, hard in QUERIES:
        qv = vec_literal(embed(q))
        # 実pgvector検索：<=> コサイン距離 + SQL内 機密フィルタ
        out = srv.psql(
            "SELECT id FROM platform.knowledge_chunk "
            "WHERE confidentiality = ANY (ARRAY['PUBLIC','INTERNAL']) "
            f"ORDER BY embedding <=> {_q(qv)} LIMIT {TOPK};")
        ids = [ln.strip() for ln in out.splitlines() if ln.strip() and ln.strip() not in ('id', '----', '(%d rows)' % TOPK)]
        ids = [x for x in ids if x.startswith('K')]
        top = ids[:TOPK]
        hit = len([x for x in relevant if x in top])
        recall = hit / len(relevant)
        rr = next((1/(i+1) for i, x in enumerate(top) if x in relevant), 0.0)
        recall_sum += recall; mrr_sum += rr
        print(f'  {"[hard]" if hard else "      "} recall={recall:.2f}  [{",".join(top)}]  {q}')

    print(f'\n  recall@{TOPK} = {recall_sum/len(QUERIES):.3f}   MRR = {mrr_sum/len(QUERIES):.3f}')

    # 機密フィルタ実証（SQL WHERE）
    leak = srv.psql("SELECT id FROM platform.knowledge_chunk "
                    "WHERE confidentiality = ANY (ARRAY['PUBLIC','INTERNAL']) "
                    f"ORDER BY embedding <=> {_q(vec_literal(embed('役員 人事 報酬 機密')))} LIMIT 5;")
    leaked = 'K12' in leak
    dept = srv.psql("SELECT id FROM platform.knowledge_chunk "
                    "WHERE (confidentiality = ANY (ARRAY['PUBLIC','INTERNAL'])) "
                    "   OR (confidentiality='DEPT' AND department='sales') "
                    f"ORDER BY embedding <=> {_q(vec_literal(embed('夜間バッチ ジョブ制御')))} LIMIT 5;")
    dept_leaked = 'K11' in dept
    print('\n--- 機密フィルタ（SQL WHERE）実証 ---')
    print(f'  K12(CONFIDENTIAL) 漏えい: {leaked}  => {"NG" if leaked else "OK(遮断)"}')
    print(f'  K11(他部門DEPT)   漏えい: {dept_leaked}  => {"NG" if dept_leaked else "OK(遮断)"}')

    avg = recall_sum / len(QUERIES)
    ok = avg >= 0.8 and not leaked and not dept_leaked
    print('\n=== 判定: ' + ('PASS ✅（真pgvector・召回≥0.8・機密遮断）' if ok else 'FAIL') + ' ===')
    srv.cleanup()
    raise SystemExit(0 if ok else 1)

def _q(s):
    return "'" + str(s).replace("'", "''") + "'"

if __name__ == '__main__':
    main()
