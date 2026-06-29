import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

function siteRootPrefix() {
  if (!ExecutionEnvironment.canUseDOM) {
    return '';
  }
  const path = window.location.pathname.replace(/\\/g, '/');
  const wikiMatch = path.match(/^(.*)\/wiki(?:\/|$)/);
  if (wikiMatch) {
    return wikiMatch[1] || '';
  }
  const fileIdx = path.lastIndexOf('/wiki');
  if (fileIdx >= 0) {
    return path.slice(0, fileIdx);
  }
  return '';
}

function resolvePortalFile(file) {
  const root = siteRootPrefix();
  const href = `${root}/${file}`.replace(/\/{2,}/g, '/');
  return href.startsWith('/') ? href : `/${href}`;
}

function ensureBackButton() {
  let back = document.getElementById('portal-back-link');
  if (!back) {
    back = document.createElement('a');
    back.id = 'portal-back-link';
    back.className = 'portal-back-btn';
    back.setAttribute('aria-label', 'ポータルへ戻る');
    back.textContent = '← ポータルへ戻る';
    document.body.prepend(back);
  }
  back.href = resolvePortalFile('index.html');
}

function fixPortalLinks() {
  ensureBackButton();

  document.querySelectorAll('[data-portal-link]').forEach((el) => {
    const file = el.getAttribute('data-portal-link');
    if (file) {
      el.href = resolvePortalFile(file);
    }
  });

  document.querySelectorAll('a[href^="portal:"]').forEach((el) => {
    const file = el.getAttribute('href').slice('portal:'.length);
    el.href = resolvePortalFile(file);
  });
}

export default function portalLinksModule() {
  if (!ExecutionEnvironment.canUseDOM) {
    return;
  }

  fixPortalLinks();

  window.addEventListener('popstate', fixPortalLinks);

  const pushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    pushState(...args);
    fixPortalLinks();
  };

  const replaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    replaceState(...args);
    fixPortalLinks();
  };
}
