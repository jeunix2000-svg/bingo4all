import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';

function Feature({title, description, link}) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className="featureCard" style={{display: 'block', textDecoration: 'none'}}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </Link>
    </div>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const pageTitle = translate({id: 'site.title', message: 'YFC AI Knowledge Platform'});
  const pageDesc = translate({id: 'site.tagline', message: siteConfig.tagline});
  return (
    <Layout title={pageTitle} description={pageDesc}>
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <Heading as="h1" className="hero__title">{siteConfig.title}</Heading>
          <p className="hero__subtitle">
            <Translate id="site.tagline">社内ナレッジ基盤 — Wiki Module + ポイント + RAG + AI Agent（設計書 V1.1）</Translate>
          </p>
          <div className={clsx('margin-top--lg')}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              <Translate id="homepage.hero.cta">設計書 V1.1 を読む</Translate>
            </Link>
          </div>
        </div>
      </header>
      <main className="features">
        <div className="container">
          <div className="row">
            <Feature
              title={<Translate id="homepage.feature.platform.title">プラットフォーム・ビジョン</Translate>}
              description={<Translate id="homepage.feature.platform.desc">Wiki を第1モジュールとする全社 AI 知識基盤。RAG・Agent・MCP への進化</Translate>}
              link="/docs/platform/vision"
            />
            <Feature
              title={<Translate id="homepage.feature.adr.title">ADR（アーキテクチャ決定）</Translate>}
              description={<Translate id="homepage.feature.adr.desc">Wiki.js / ポイント MS / pgvector / Claude / Platform 化 / MCP の採用理由</Translate>}
              link="/docs/adr/overview"
            />
            <Feature
              title={<Translate id="homepage.feature.api.title">Wiki API</Translate>}
              description={<Translate id="homepage.feature.api.desc">OpenAPI 3.0 — 投稿・評価・統計・AI 支援。Controller 自動生成の基準</Translate>}
              link="/docs/api/overview"
            />
            <Feature
              title={<Translate id="homepage.feature.points.title">ポイントサービス</Translate>}
              description={<Translate id="homepage.feature.points.desc">append-only 台帳・防刷分・レベル・バッジ。yfc_points_service.sql</Translate>}
              link="/docs/data/points-service"
            />
            <Feature
              title={<Translate id="homepage.feature.devops.title">DevOps・開発規範</Translate>}
              description={<Translate id="homepage.feature.devops.desc">CI/CD DevSecOps / コーディング規約 / テスト戦略 / Prompt Catalog</Translate>}
              link="/docs/devops/cicd-devsecops"
            />
            <Feature
              title={<Translate id="homepage.feature.roadmap.title">進化ロードマップ</Translate>}
              description={<Translate id="homepage.feature.roadmap.desc">Phase 0 Wiki PoC → Phase 4 多アプリ展開（営業日報AI / COBOL移行AI 等）</Translate>}
              link="/docs/roadmap/phases"
            />
          </div>
        </div>
      </main>
    </Layout>
  );
}
