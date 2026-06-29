(function () {
  'use strict';

  function tr(k, vars) {
    return window.YFC_I18N ? YFC_I18N.t(k, vars) : k;
  }

  const cfg = window.YFC_PORTAL_CONFIG || {};
  const wikiApi = (cfg.wikiApiUrl || '').replace(/\/$/, '');
  const pointsApi = (cfg.pointsApiUrl || '').replace(/\/$/, '');
  const userId = cfg.demoUserId || '00000000-0000-4000-8000-000000000001';
  const userRole = cfg.demoUserRole || 'EMPLOYEE';
  const userName = cfg.demoUserName || 'Portal Demo';

  const els = {
    status: document.getElementById('api-status'),
    statusDetail: document.getElementById('api-status-detail'),
    posts: document.getElementById('posts-list'),
    form: document.getElementById('post-form'),
    refresh: document.getElementById('btn-refresh'),
    balance: document.getElementById('points-balance'),
  };

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-role': userRole,
      'x-user-name': userName,
    };
  }

  function setStatus(ok, title, detail) {
    if (!els.status) return;
    els.status.className = 'status-pill ' + (ok ? 'ok' : 'err');
    els.status.textContent = title;
    if (els.statusDetail) els.statusDetail.textContent = detail || '';
  }

  async function apiFetch(base, path, options) {
    const res = await fetch(base + path, options);
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text };
    }
    if (!res.ok) {
      const msg = body?.message || body?.code || res.statusText || 'request failed';
      throw new Error(msg + ' (' + res.status + ')');
    }
    return body;
  }

  async function checkHealth() {
    if (!wikiApi) {
      setStatus(false, tr('wikiapp.status_no_api'), tr('wikiapp.status_no_api_detail'));
      return false;
    }
    if (/\/wiki\/?$/i.test(wikiApi)) {
      setStatus(false, tr('wikiapp.status_bad_url'), tr('wikiapp.status_bad_url_detail'));
      return false;
    }
    try {
      await apiFetch(wikiApi, '/health');
      setStatus(true, tr('wikiapp.status_ok'), wikiApi);
      return true;
    } catch (err) {
      setStatus(
        false,
        tr('wikiapp.status_err'),
        String(err.message || err) + tr('wikiapp.status_err_suffix')
      );
      return false;
    }
  }

  async function loadBalance() {
    if (!els.balance || !pointsApi) return;
    try {
      const data = await apiFetch(pointsApi, '/api/v1/points/balance/' + encodeURIComponent(userId));
      els.balance.textContent = tr('wikiapp.balance', { n: data.total ?? 0 });
    } catch {
      els.balance.textContent = tr('wikiapp.balance_na');
    }
  }

  function renderPosts(page) {
    if (!els.posts) return;
    if (!page.items.length) {
      els.posts.innerHTML = '<p class="empty">' + escapeHtml(tr('wikiapp.posts_empty')) + '</p>';
      return;
    }
    els.posts.innerHTML = page.items
      .map(function (p) {
        return (
          '<article class="post-card">' +
          '<div class="post-meta">' +
          '<span class="tag">' + escapeHtml(p.postType) + '</span>' +
          '<span class="tag muted">' + escapeHtml(p.status) + '</span>' +
          '<span class="date">' + escapeHtml(p.createdAt || '') + '</span>' +
          '</div>' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
          '<p>' + escapeHtml(p.summary || tr('wikiapp.no_summary')) + '</p>' +
          '<div class="post-foot">👍 ' + (p.upvoteCount || 0) + ' · ' + escapeHtml(p.categoryCode) + '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  async function loadPosts() {
    if (!els.posts) return;
    els.posts.innerHTML = '<p class="empty">' + escapeHtml(tr('wikiapp.posts_loading')) + '</p>';
    try {
      const page = await apiFetch(wikiApi, '/api/v1/posts?page=1&size=20', {
        headers: authHeaders(),
      });
      renderPosts(page);
    } catch (err) {
      els.posts.innerHTML = '<p class="empty err">' + escapeHtml(String(err.message || err)) + '</p>';
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function createPost(ev) {
    ev.preventDefault();
    const fd = new FormData(els.form);
    const payload = {
      title: String(fd.get('title') || '').trim(),
      categoryCode: String(fd.get('categoryCode') || 'GENERAL').trim(),
      postType: String(fd.get('postType') || 'SHARE'),
      summary: String(fd.get('summary') || '').trim(),
      body: String(fd.get('body') || '').trim(),
      confidentiality: String(fd.get('confidentiality') || 'INTERNAL'),
      tags: [],
    };
    const btn = els.form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      await apiFetch(wikiApi, '/api/v1/posts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      els.form.reset();
      await loadPosts();
      await loadBalance();
    } catch (err) {
      alert(tr('wikiapp.create_fail', { msg: err.message || err }));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function refreshWikiAppUi() {
    if (window.YFC_I18N) YFC_I18N.apply();
    const ok = await checkHealth();
    if (ok) {
      await loadPosts();
      await loadBalance();
    }
  }

  document.addEventListener('portal-lang-change', refreshWikiAppUi);

  async function init() {
    const ok = await checkHealth();
    if (ok) {
      await loadPosts();
      await loadBalance();
    }
    if (els.form) els.form.addEventListener('submit', createPost);
    if (els.refresh) {
      els.refresh.addEventListener('click', async function () {
        const ready = await checkHealth();
        if (ready) {
          await loadPosts();
          await loadBalance();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
