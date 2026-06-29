/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  wikiSidebar: [
    'intro',
    {
      type: 'category',
      label: '1. プラットフォーム',
      collapsed: false,
      items: [
        'platform/vision',
        'platform/architecture',
        'platform/wiki-module',
      ],
    },
    {
      type: 'category',
      label: '2. ADR（アーキテクチャ決定）',
      items: [
        'adr/overview',
        'adr/wiki-js',
        'adr/points-microservice',
        'adr/postgresql-pgvector',
        'adr/claude-api',
        'adr/platformization',
        'adr/mcp-gateway',
      ],
    },
    {
      type: 'category',
      label: '3. 設計（Sequence / NFR / Security）',
      items: [
        'design/sequences',
        'design/nfr-performance',
        'design/stride-security',
      ],
    },
    {
      type: 'category',
      label: '4. Wiki API',
      items: [
        'api/overview',
        'api/endpoints',
      ],
    },
    {
      type: 'category',
      label: '5. データ（ポイントサービス）',
      items: [
        'data/points-service',
        'data/schema-reference',
      ],
    },
    {
      type: 'category',
      label: '6. DevOps・開発規範',
      items: [
        'devops/cicd-devsecops',
        'devops/coding-standard',
        'devops/test-strategy',
        'devops/ai-prompt-catalog',
      ],
    },
    {
      type: 'category',
      label: '7. ロードマップ',
      items: [
        'roadmap/phases',
        'roadmap/v10-inheritance',
      ],
    },
    {
      type: 'category',
      label: 'Wiki 運用・構築',
      items: [
        'dev/setup',
        'dev/deploy',
      ],
    },
  ],
};

module.exports = sidebars;
