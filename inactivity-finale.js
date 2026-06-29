/**
 * 无操作结束倒计时最后 15 秒 — 全屏数字旋转向中心消失
 */
(() => {
  const FINALE_THRESHOLD = 15;
  const RANGES = [
    { letter: "B", min: 1, max: 15, color: "#e74c3c" },
    { letter: "I", min: 16, max: 30, color: "#f1c40f" },
    { letter: "N", min: 31, max: 45, color: "#3498db" },
    { letter: "G", min: 46, max: 60, color: "#2ecc71" },
    { letter: "O", min: 61, max: 75, color: "#a29bfe" },
  ];

  let canvas = null;
  let ctx = null;
  let rafId = null;
  let particles = [];
  let active = false;
  let lastSecond = -1;
  let centerEl = null;
  let vignetteEl = null;
  let currentRemain = 0;
  let styleInjected = false;

  function getMeta(num) {
    for (const r of RANGES) {
      if (num >= r.min && num <= r.max) return r;
    }
    return { letter: "B", color: "#ffd700" };
  }

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      #inactivity-finale-canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 390;
        pointer-events: none;
        display: none;
      }
      #inactivity-finale-vignette {
        position: fixed;
        inset: 0;
        z-index: 389;
        pointer-events: none;
        display: none;
        background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%);
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      #inactivity-finale-vignette.visible { opacity: 1; }
      #inactivity-finale-countdown {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 391;
        display: none;
        align-items: center;
        justify-content: center;
        width: min(42vw, 200px);
        height: min(42vw, 200px);
        border-radius: 50%;
        font-size: clamp(4rem, 18vw, 7rem);
        font-weight: 900;
        color: #fff;
        letter-spacing: -0.04em;
        text-shadow: 0 0 40px rgba(255, 80, 80, 0.9), 0 0 80px rgba(255, 215, 0, 0.45);
        border: 4px solid rgba(255, 100, 100, 0.75);
        background: radial-gradient(circle, rgba(120, 20, 20, 0.88) 0%, rgba(30, 10, 10, 0.92) 70%);
        box-shadow: 0 0 60px rgba(255, 60, 60, 0.45), inset 0 0 30px rgba(0,0,0,0.35);
        pointer-events: none;
      }
      #inactivity-finale-countdown.pulse {
        animation: inactivity-finale-pulse 0.55s cubic-bezier(0.34, 1.45, 0.64, 1);
      }
      @keyframes inactivity-finale-pulse {
        0%   { transform: translate(-50%, -50%) scale(0.82); opacity: 0.7; }
        45%  { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    injectStyles();
    if (!vignetteEl) {
      vignetteEl = document.createElement("div");
      vignetteEl.id = "inactivity-finale-vignette";
      document.body.appendChild(vignetteEl);
    }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "inactivity-finale-canvas";
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
      window.addEventListener("resize", resizeCanvas);
    }
    if (!centerEl) {
      centerEl = document.createElement("div");
      centerEl.id = "inactivity-finale-countdown";
      centerEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(centerEl);
    }
    resizeCanvas();
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const edge = Math.floor(Math.random() * 4);
    let x;
    let y;
    if (edge === 0) { x = Math.random() * w; y = -50 - Math.random() * 40; }
    else if (edge === 1) { x = w + 50 + Math.random() * 40; y = Math.random() * h; }
    else if (edge === 2) { x = Math.random() * w; y = h + 50 + Math.random() * 40; }
    else { x = -50 - Math.random() * 40; y = Math.random() * h; }

    const num = Math.floor(Math.random() * 75) + 1;
    const meta = getMeta(num);
    const dx = cx - x;
    const dy = cy - y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 1.4 + Math.random() * 2.2;

    particles.push({
      x,
      y,
      num,
      letter: meta.letter,
      color: meta.color,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() > 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.1),
      scale: 0.65 + Math.random() * 0.9,
      life: 1,
      fontSize: 22 + Math.random() * 18,
    });
  }

  function spawnBurst(w, h, count) {
    for (let i = 0; i < count; i += 1) spawnParticle(w, h);
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.scale, p.scale);
    ctx.font = `900 ${p.fontSize}px "Hiragino Sans", "Yu Gothic", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.fillText(String(p.num), 0, 2);
    ctx.shadowBlur = 0;
    ctx.font = `700 ${Math.max(10, p.fontSize * 0.34)}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(p.letter, 0, -p.fontSize * 0.52);
    ctx.restore();
  }

  function tick() {
    if (!active || !ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    const urgency = 1 - currentRemain / FINALE_THRESHOLD;
    if (Math.random() < 0.22 + urgency * 0.35) spawnParticle(w, h);

    const absorbRadius = 42 + currentRemain * 6;

    for (const p of particles) {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = 0.025 + urgency * 0.06;
      p.vx += (dx / dist) * pull;
      p.vy += (dy / dist) * pull;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      if (dist < absorbRadius) {
        p.life -= 0.1 + urgency * 0.06;
        p.scale *= 0.9;
        p.vr *= 1.04;
      } else {
        p.life -= 0.003;
      }

      if (p.life > 0.04) drawParticle(p);
    }

    particles = particles.filter((p) => p.life > 0.04);
    rafId = requestAnimationFrame(tick);
  }

  function updateCenterCountdown(remain) {
    if (!centerEl) return;
    centerEl.textContent = String(remain);
    centerEl.classList.remove("pulse");
    void centerEl.offsetWidth;
    centerEl.classList.add("pulse");
  }

  function showOverlay() {
    ensureOverlay();
    canvas.style.display = "block";
    vignetteEl.style.display = "block";
    requestAnimationFrame(() => vignetteEl.classList.add("visible"));
    centerEl.style.display = "flex";
  }

  function hideOverlay() {
    if (vignetteEl) {
      vignetteEl.classList.remove("visible");
      vignetteEl.style.display = "none";
    }
    if (canvas) {
      canvas.style.display = "none";
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (centerEl) centerEl.style.display = "none";
  }

  window.updateInactivityFinale = function updateInactivityFinale(remainSec) {
    const remain = Math.max(0, Math.ceil(Number(remainSec) || 0));
    if (remain <= 0 || remain > FINALE_THRESHOLD) {
      window.stopInactivityFinale();
      return;
    }

    currentRemain = remain;
    if (!active) {
      active = true;
      particles = [];
      showOverlay();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    if (remain !== lastSecond) {
      lastSecond = remain;
      updateCenterCountdown(remain);
      spawnBurst(window.innerWidth, window.innerHeight, 10 + (FINALE_THRESHOLD - remain) * 2);
    }
  };

  window.stopInactivityFinale = function stopInactivityFinale() {
    active = false;
    lastSecond = -1;
    currentRemain = 0;
    particles = [];
    cancelAnimationFrame(rafId);
    rafId = null;
    hideOverlay();
  };
})();
