// poc/corpus.mjs — 社内ナレッジ（Wiki由来想定）の小規模コーパスと、ラベル付き評価クエリ。
// クエリは対象チャンクと「異なる語彙」で記述し、語彙一致ではなく意味で引けるか（=semantic recall）を検証する。
export const CHUNKS = [
  { id: 'K1', confidentiality: 'INTERNAL', text: 'COBOLからJavaへのマイグレーション手順。固定長レコードとデータ移植の注意点。' },
  { id: 'K2', confidentiality: 'INTERNAL', text: 'JCLのジョブが異常終了。リターンコードRC=12の調査と対処の事例。' },
  { id: 'K3', confidentiality: 'INTERNAL', text: 'Entra IDによるシングルサインオン設定手順。OIDCの認証フロー。' },
  { id: 'K4', confidentiality: 'INTERNAL', text: 'PostgreSQLのクエリが遅い。インデックス設計とチューニングでレイテンシ改善。' },
  { id: 'K5', confidentiality: 'INTERNAL', text: 'リリースのCI/CDパイプライン構築。GitHub Actionsからのデプロイ自動化。' },
  { id: 'K6', confidentiality: 'INTERNAL', text: 'データベースの暗号化と脆弱性対応。保存時暗号化のセキュリティ設定。' },
  { id: 'K7', confidentiality: 'INTERNAL', text: 'ユニットテストと結合試験の品質基準。カバレッジの検証方針。' },
  { id: 'K8', confidentiality: 'INTERNAL', text: 'レガシーシステムのリプレース計画。コボル資産の段階的な移植戦略。' },
  { id: 'K9', confidentiality: 'INTERNAL', text: 'ログインができない障害。SSOトークンの期限切れが原因のケース。' },
  { id: 'K10', confidentiality: 'INTERNAL', text: 'SQLのパフォーマンスが悪い時のクエリチューニング実例。' },
  { id: 'K11', confidentiality: 'DEPT', department: 'finance', text: '金融部門のジョブ制御運用ルール。夜間バッチのJCL標準。' },
  { id: 'K12', confidentiality: 'CONFIDENTIAL', text: '役員人事と報酬に関する機密メモ。取扱注意。' },
];

// query → 正解チャンクID集合（語彙はあえてズラす）
export const QUERIES = [
  // 「hard」=対象チャンクと表面語が一致しない（同義語のみ）。語彙一致では引けないが意味では引ける。
  { q: 'レガシー言語の入れ替え作業の注意点', relevant: ['K1', 'K8'], hard: true },   // 入れ替え≈マイグレーション/リプレース, レガシー≈COBOL
  { q: 'バッチのジョブ制御が障害で停止した', relevant: ['K2'], hard: true },          // 障害≈異常/RC, ジョブ制御≈JCL
  { q: 'SSOのサインオン手順を知りたい', relevant: ['K3', 'K9'], hard: true },          // SSO≈Entra/認証
  { q: 'DBが重いときの改善方法', relevant: ['K4', 'K10'], hard: true },               // 重い≈遅い/性能, DB≈PostgreSQL
  { q: '本番への自動リリース', relevant: ['K5'], hard: false },                       // リリース(K5に存在)
  { q: '暗号化によるセキュリティ対策', relevant: ['K6'], hard: false },                // 表面一致あり
  { q: 'コボル資産の移植戦略', relevant: ['K8', 'K1'], hard: false },
  { q: 'ログイン障害の原因調査', relevant: ['K9'], hard: false },
];

// キーワードベースライン用の語彙（同義語の各surface formを含む）
export { SYNONYM_GROUPS } from './embedding.mjs';
