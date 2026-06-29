// @ts-check
const {themes} = require('prism-react-renderer');
const fs = require('fs');
const path = require('path');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const portalLinkScript = fs.readFileSync(
  path.join(__dirname, 'static/js/portal-link.js'),
  'utf8',
);

/** @returns {import('@docusaurus/types').Plugin} */
function portalBackPlugin() {
  return {
    name: 'portal-back-plugin',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'style',
            attributes: {},
            innerHTML: `
.portal-back-btn{position:fixed;top:.75rem;left:.75rem;z-index:500;display:inline-flex;align-items:center;padding:.45rem 1rem;font-size:.85rem;font-weight:600;letter-spacing:.04em;color:#1a1a2e!important;background:linear-gradient(135deg,#ffd700,#ffb347);border:none;border-radius:50px;text-decoration:none!important;box-shadow:0 4px 18px rgba(255,215,0,.35);font-family:"Hiragino Sans","Yu Gothic","Meiryo",sans-serif}
.portal-back-btn:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(255,215,0,.5);color:#1a1a2e!important}
@media (max-width:996px){.portal-back-btn{top:auto;bottom:1rem;left:.75rem;z-index:200}}
            `.trim(),
          },
        ],
        preBodyTags: [
          {
            tagName: 'a',
            attributes: {
              id: 'portal-back-link',
              class: 'portal-back-btn',
              href: '../index.html',
              'aria-label': 'ポータルへ戻る',
            },
            innerHTML: '← ポータルへ戻る',
          },
          {
            tagName: 'script',
            attributes: {},
            innerHTML: portalLinkScript,
          },
        ],
      };
    },
  };
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'YFC AI Knowledge Platform',
  tagline: '社内ナレッジ基盤 — Wiki Module + ポイント + RAG + AI Agent（設計書 V1.1）',
  favicon: 'img/favicon.ico',

  url: 'http://192.168.211.34',
  baseUrl: '/wiki/',

  organizationName: 'yfc',
  projectName: 'yfc-ai-knowledge-platform',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  clientModules: [require.resolve('./src/clientModules/portalLinks.js')],

  plugins: [portalBackPlugin],

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'zh-Hans', 'en'],
    localeConfigs: {
      ja: {
        label: '日本語',
        htmlLang: 'ja',
      },
      'zh-Hans': {
        label: '中文',
        htmlLang: 'zh-Hans',
      },
      en: {
        label: 'English',
        htmlLang: 'en',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/yfc-social-card.jpg',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'YFC AI Platform',
        logo: {
          alt: 'YFC AI Knowledge Platform',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'wikiSidebar',
            position: 'left',
            label: 'ドキュメント',
          },
          {
            to: '/docs/intro',
            label: 'はじめに',
            position: 'left',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '設計',
            items: [
              {label: 'プラットフォーム', to: '/docs/platform/vision'},
              {label: 'ADR', to: '/docs/adr/overview'},
              {label: 'Wiki API', to: '/docs/api/overview'},
            ],
          },
          {
            title: 'ドキュメント',
            items: [
              {label: 'はじめに', to: '/docs/intro'},
              {label: 'ポイントサービス', to: '/docs/data/points-service'},
              {label: 'ロードマップ', to: '/docs/roadmap/phases'},
            ],
          },
          {
            title: 'リンク',
            items: [
              {label: 'ポータルへ戻る', href: 'portal:index.html'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} YFC AI Knowledge Platform.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
