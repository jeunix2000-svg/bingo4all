/**
 * 无操作结束倒计时最后 15 秒 — 全屏秒数缩小变淡
 */
(() => {
  const FINALE_THRESHOLD = 15;

  let active = false;
  let lastSecond = -1;
  let centerEl = null;
  let styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      #inactivity-finale-countdown {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(1);
        z-index: 391;
        display: none;
        align-items: center;
        justify-content: center;
        width: auto;
        height: auto;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        font-size: min(72vw, 72vh);
        font-weight: 900;
        line-height: 1;
        color: #fff;
        letter-spacing: -0.04em;
        text-shadow:
          0 0 40px rgba(255, 80, 80, 0.95),
          0 0 90px rgba(255, 215, 0, 0.55),
          0 8px 32px rgba(0, 0, 0, 0.65);
        pointer-events: none;
        opacity: 1;
      }
      #inactivity-finale-countdown.tick {
        animation: inactivity-finale-second 1s ease-out forwards;
      }
      @keyframes inactivity-finale-second {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(0.22);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyles();
    if (!centerEl) {
      centerEl = document.createElement("div");
      centerEl.id = "inactivity-finale-countdown";
      centerEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(centerEl);
    }
  }

  function updateCenterCountdown(remain) {
    if (!centerEl) return;
    centerEl.textContent = String(remain);
    centerEl.classList.remove("tick");
    void centerEl.offsetWidth;
    centerEl.style.opacity = "1";
    centerEl.style.transform = "translate(-50%, -50%) scale(1)";
    centerEl.classList.add("tick");
  }

  function showOverlay() {
    ensureOverlay();
    centerEl.style.display = "flex";
  }

  function hideOverlay() {
    if (centerEl) {
      centerEl.style.display = "none";
      centerEl.classList.remove("tick");
    }
  }

  window.updateInactivityFinale = function updateInactivityFinale(remainSec) {
    const remain = Math.max(0, Math.ceil(Number(remainSec) || 0));
    if (remain <= 0 || remain > FINALE_THRESHOLD) {
      window.stopInactivityFinale();
      return;
    }

    if (!active) {
      active = true;
      showOverlay();
    }

    if (remain !== lastSecond) {
      lastSecond = remain;
      updateCenterCountdown(remain);
    }
  };

  window.stopInactivityFinale = function stopInactivityFinale() {
    active = false;
    lastSecond = -1;
    hideOverlay();
  };
})();
