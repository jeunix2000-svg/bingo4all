(function () {
  var STORAGE_KEY = "portal_lang";
  var LANGS = ["ja", "zh", "en"];

  function wikiRootPrefix() {
    var path = location.pathname.replace(/\\/g, "/");
    var match = path.match(/^(.*)\/wiki(?:\/|$)/);
    if (match) return match[1] || "";
    var idx = path.indexOf("/wiki");
    if (idx >= 0) return path.slice(0, idx);
    return "";
  }

  function portalHref(file) {
    if (location.protocol === "file:") {
      var path = location.pathname.replace(/\\/g, "/");
      var dir = path.endsWith("/") ? path : path.substring(0, path.lastIndexOf("/") + 1);
      var wikiPos = dir.indexOf("/wiki/");
      if (wikiPos < 0) return "../" + file;
      var afterWiki = dir.substring(wikiPos + 6);
      var depth = afterWiki.split("/").filter(Boolean).length;
      return "../".repeat(depth + 1) + file;
    }
    var root = wikiRootPrefix();
    var href = (root ? root : "") + "/" + file;
    href = href.replace(/\/{2,}/g, "/");
    return href.charAt(0) === "/" ? href : "/" + href;
  }

  function getLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.indexOf(saved) >= 0) return saved;
    } catch (_) { /* ignore */ }
    var path = location.pathname;
    if (path.indexOf("/zh-Hans/") >= 0) return "zh";
    if (path.indexOf("/en/") >= 0) return "en";
    return "ja";
  }

  function portalBackLabel(lang) {
    if (lang === "zh") return "← 返回门户";
    if (lang === "en") return "← Back to Portal";
    return "← ポータルへ戻る";
  }

  function portalBackAria(lang) {
    if (lang === "zh") return "返回门户";
    if (lang === "en") return "Back to Portal";
    return "ポータルへ戻る";
  }

  function wikiPathForLang(lang) {
    var path = location.pathname.replace(/\\/g, "/");
    var wikiIdx = path.indexOf("/wiki");
    if (wikiIdx < 0) return path;
    var sub = path.slice(wikiIdx + 5);
    if (sub.indexOf("/zh-Hans") === 0) sub = sub.slice("/zh-Hans".length);
    else if (sub.indexOf("/en") === 0) sub = sub.slice("/en".length);
    if (sub.charAt(0) !== "/") sub = "/" + sub;
    if (lang === "zh") return path.slice(0, wikiIdx) + "/wiki/zh-Hans" + sub;
    if (lang === "en") return path.slice(0, wikiIdx) + "/wiki/en" + sub;
    return path.slice(0, wikiIdx) + "/wiki" + sub;
  }

  function i18nCssHref() {
    var path = location.pathname.replace(/\\/g, "/");
    if (path.indexOf("/wiki/zh-Hans/") >= 0 || path.indexOf("/wiki/en/") >= 0) {
      return portalHref("wiki/css/portal-i18n.css").replace(/wiki\/css\/portal-i18n\.css$/, function () {
        var depth = path.split("/").filter(Boolean).length;
        var wikiPos = path.indexOf("/wiki/");
        var after = path.slice(wikiPos + 6).split("/").filter(Boolean).length;
        return "../".repeat(after) + "css/portal-i18n.css";
      });
    }
    if (path.indexOf("/wiki/") >= 0) {
      var afterWiki = path.slice(path.indexOf("/wiki/") + 6).split("/").filter(Boolean).length;
      return "../".repeat(afterWiki) + "css/portal-i18n.css";
    }
    return portalHref("portal-i18n.css");
  }

  function ensureI18nCss() {
    if (document.getElementById("portal-i18n-wiki-css")) return;
    var link = document.createElement("link");
    link.id = "portal-i18n-wiki-css";
    link.rel = "stylesheet";
    var path = location.pathname.replace(/\\/g, "/");
    var wikiPos = path.indexOf("/wiki/");
    if (wikiPos < 0) {
      link.href = portalHref("portal-i18n.css");
    } else {
      var after = path.slice(wikiPos + 6).split("/").filter(Boolean).length;
      link.href = "../".repeat(after) + "css/portal-i18n.css";
    }
    document.head.appendChild(link);
  }

  function injectLangSwitcher() {
    if (document.querySelector(".portal-lang-switcher")) return;
    ensureI18nCss();
    var wrap = document.createElement("div");
    wrap.className = "portal-lang-switcher portal-lang-switcher--fixed";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language");
    LANGS.forEach(function (lang) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "portal-lang-btn" + (getLang() === lang ? " is-active" : "");
      btn.setAttribute("data-lang", lang);
      btn.textContent = lang === "ja" ? "日" : lang === "zh" ? "中" : "EN";
      btn.addEventListener("click", function () {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* ignore */ }
        var target = wikiPathForLang(lang);
        if (target && target !== location.pathname) {
          location.assign(target + location.search + location.hash);
        }
      });
      wrap.appendChild(btn);
    });
    document.body.appendChild(wrap);
  }

  function fixPortalLinks() {
    var lang = getLang();
    var back = document.getElementById("portal-back-link");
    if (back) {
      back.href = portalHref("index.html");
      back.textContent = portalBackLabel(lang);
      back.setAttribute("aria-label", portalBackAria(lang));
    }

    document.querySelectorAll("[data-portal-link]").forEach(function (el) {
      var file = el.getAttribute("data-portal-link");
      if (file) el.href = portalHref(file);
      el.removeAttribute("target");
      el.removeAttribute("rel");
    });

    document.querySelectorAll('a[href^="portal:"]').forEach(function (el) {
      el.href = portalHref(el.getAttribute("href").slice("portal:".length));
      el.removeAttribute("target");
      el.removeAttribute("rel");
    });

    injectLangSwitcher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fixPortalLinks);
  } else {
    fixPortalLinks();
  }
  window.addEventListener("popstate", fixPortalLinks);
})();
