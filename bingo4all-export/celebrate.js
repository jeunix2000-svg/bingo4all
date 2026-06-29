(() => {
  const COLORS = [
    "#ffd700", "#ff6b6b", "#4ecdc4", "#3498db", "#2ecc71",
    "#a29bfe", "#ff9ff3", "#54a0ff", "#ff4757", "#ffa502",
  ];

  let canvas = null;
  let ctx = null;
  let rafId = null;
  let particles = [];
  let spawning = false;
  let bannerEl = null;
  let activeFlyer = null;
  let styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      #celebrate-canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 500;
        pointer-events: none;
      }
      #celebrate-banner {
        position: fixed;
        left: 50%;
        top: 8%;
        transform: translate(-50%, -120%);
        z-index: 501;
        pointer-events: none;
        text-align: center;
        padding: 1.2rem 2rem 1.4rem;
        min-width: min(92vw, 520px);
        border-radius: 20px;
        background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,248,220,0.92));
        border: 2px solid rgba(255, 215, 0, 0.65);
        box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 80px rgba(255,215,0,0.35);
        opacity: 0;
      }
      #celebrate-banner.show {
        animation: celebrate-banner-in 0.65s cubic-bezier(0.34, 1.45, 0.64, 1) forwards;
      }
      #celebrate-banner.hide {
        animation: celebrate-banner-out 0.55s ease forwards;
      }
      @keyframes celebrate-banner-in {
        0%   { opacity: 0; transform: translate(-50%, -130%) scale(0.85); }
        60%  { opacity: 1; transform: translate(-50%, 8%) scale(1.04); }
        100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
      }
      @keyframes celebrate-banner-out {
        0%   { opacity: 1; transform: translate(-50%, 0) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -30%) scale(0.92); }
      }
      #celebrate-banner .celebrate-en {
        font-size: clamp(1.6rem, 5vw, 2.4rem);
        font-weight: 800;
        letter-spacing: 0.06em;
        background: linear-gradient(90deg, #c0392b, #ffd700, #27ae60);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.35rem;
      }
      #celebrate-banner .celebrate-zh {
        font-size: clamp(1.35rem, 4.5vw, 2rem);
        font-weight: 700;
        color: #c0392b;
        margin-bottom: 0.25rem;
      }
      #celebrate-banner .celebrate-ja {
        font-size: clamp(1.1rem, 3.5vw, 1.55rem);
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      }
      #celebrate-banner .celebrate-sub {
        font-size: clamp(0.95rem, 3vw, 1.15rem);
        font-weight: 600;
        color: #8a6a1e;
        border-top: 1px solid rgba(255, 215, 0, 0.4);
        padding-top: 0.55rem;
      }
      #celebrate-banner .celebrate-sub:empty { display: none; }
      #celebrate-banner .celebrate-hero {
        display: none;
        margin: 0.4rem 0 0.5rem;
        padding: 0.5rem 0 0.2rem;
      }
      #celebrate-banner.has-hero {
        min-width: min(94vw, 560px);
        padding: 1rem 1.5rem 1.2rem;
      }
      #celebrate-banner.has-hero .celebrate-en {
        font-size: clamp(1.1rem, 3.5vw, 1.65rem);
        margin-bottom: 0.15rem;
      }
      #celebrate-banner.has-hero .celebrate-zh {
        font-size: clamp(1rem, 3vw, 1.45rem);
        margin-bottom: 0.1rem;
      }
      #celebrate-banner.has-hero .celebrate-ja {
        font-size: clamp(0.9rem, 2.8vw, 1.2rem);
        margin-bottom: 0.35rem;
      }
      #celebrate-banner.has-hero .celebrate-hero {
        display: block;
      }
      #celebrate-banner .celebrate-hero-box {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1.5rem 0.9rem;
        min-width: 9rem;
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,248,220,0.88));
        border: 2px solid rgba(255, 215, 0, 0.65);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
      }
      #celebrate-banner .celebrate-letter {
        display: block;
        font-size: clamp(1.4rem, 5vw, 2.2rem);
        font-weight: 800;
        letter-spacing: 0.15em;
        color: var(--hero-color, #ffd700);
        margin-bottom: 0.15rem;
      }
      #celebrate-banner .celebrate-number {
        display: block;
        font-size: clamp(5rem, 22vw, 9rem);
        font-weight: 900;
        line-height: 0.95;
        letter-spacing: 0.02em;
        color: var(--hero-color, #ffd700);
        text-shadow:
          0 4px 24px rgba(0, 0, 0, 0.2),
          0 0 50px color-mix(in srgb, var(--hero-color, #ffd700) 45%, transparent);
        animation: celebrate-num-pop 0.55s cubic-bezier(0.34, 1.5, 0.64, 1) 0.2s both;
      }
      @keyframes celebrate-num-pop {
        0%   { transform: scale(0.5); opacity: 0; }
        70%  { transform: scale(1.08); }
        100% { transform: scale(1); opacity: 1; }
      }
      #celebrate-banner.has-hero .celebrate-sub {
        font-size: clamp(1rem, 3.5vw, 1.35rem);
        color: #c0392b;
        font-weight: 800;
        border-top: none;
        padding-top: 0.25rem;
      }
      #celebrate-banner.celebrate-fly-prep .celebrate-en,
      #celebrate-banner.celebrate-fly-prep .celebrate-zh,
      #celebrate-banner.celebrate-fly-prep .celebrate-ja,
      #celebrate-banner.celebrate-fly-prep .celebrate-sub,
      #celebrate-banner.celebrate-fly-prep .celebrate-hero {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #celebrate-banner.celebrate-fly-prep {
        background: transparent;
        border-color: transparent;
        box-shadow: none;
      }
      .celebrate-flyer {
        position: fixed;
        z-index: 502;
        pointer-events: none;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,248,220,0.88));
        border: 2px solid rgba(255, 215, 0, 0.65);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
        color: var(--hero-color, #ffd700);
        will-change: left, top, width, height, border-radius, background, border-color;
      }
      .celebrate-flyer .fly-num {
        font-weight: 900;
        line-height: 1;
        font-size: clamp(2.5rem, 12vw, 5.5rem);
        transition: font-size 1.25s cubic-bezier(0.42, 0, 0.18, 1), color 0.35s ease;
      }
      .celebrate-flyer.landed {
        opacity: 0;
        transition: opacity 0.12s ease;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.id = "celebrate-canvas";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    return canvas;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnParticle(w, h) {
    const ribbon = Math.random() < 0.55;
    return {
      x: rand(0, w),
      y: rand(-h * 0.15, -8),
      w: ribbon ? rand(6, 12) : rand(5, 9),
      h: ribbon ? rand(22, 48) : rand(5, 9),
      vx: rand(-1.8, 1.8),
      vy: rand(2.5, 6.5),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.12, 0.12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
      ribbon,
    };
  }

  function spawnBurst(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < count; i++) particles.push(spawnParticle(w, h));
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.ribbon) {
      ctx.fillRect(-p.w / 2, 0, p.w, p.h);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(-p.w / 4, 0, p.w / 2, p.h * 0.6);
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function tick() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    let alive = 0;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.vx += Math.sin(p.y * 0.02) * 0.02;
      p.rot += p.vr;
      if (p.y > h + 40) p.alpha -= 0.04;
      if (p.alpha > 0) {
        drawParticle(p);
        alive++;
      }
    }
    particles = particles.filter((p) => p.alpha > 0.02);

    if (spawning && Math.random() < 0.35) spawnBurst(4);

    if (particles.length > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      spawning = false;
      ctx.clearRect(0, 0, w, h);
      if (canvas) {
        canvas.remove();
        canvas = null;
        ctx = null;
      }
    }
  }

  function startConfetti(intensity) {
    injectStyles();
    ensureCanvas();
    resizeCanvas();
    particles = [];
    spawning = true;
    spawnBurst(80 + intensity * 18);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
    setTimeout(() => { spawning = false; }, 3200 + intensity * 200);
  }

  function resetBanner() {
    if (!bannerEl) return;
    clearTimeout(bannerEl._hideTimer);
    bannerEl.classList.remove("show", "hide", "celebrate-fly-prep");
    bannerEl.style.visibility = "";
    bannerEl.style.opacity = "";
  }

  function removeFlyer() {
    if (activeFlyer) {
      clearTimeout(activeFlyer._timer);
      activeFlyer.remove();
      activeFlyer = null;
    }
  }

  function fadeBannerOut() {
    if (!bannerEl) return;
    bannerEl.classList.remove("show");
    bannerEl.classList.add("hide");
    clearTimeout(bannerEl._hideTimer);
    bannerEl._hideTimer = setTimeout(resetBanner, 550);
  }

  function flyNumberToCell(opts) {
    if (!bannerEl) return;
    const heroBox = bannerEl.querySelector(".celebrate-hero-box");
    const target = document.querySelector(
      opts.flyTarget || `.master-cell[data-bingo-num="${opts.number}"]`
    );
    if (!heroBox || !target) {
      fadeBannerOut();
      return;
    }

    const from = heroBox.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !to.width) {
      fadeBannerOut();
      return;
    }

    removeFlyer();
    bannerEl.classList.add("celebrate-fly-prep");
    target.classList.add("fly-pending");

    const color = opts.color || "#ffd700";
    const flyer = document.createElement("div");
    flyer.className = "celebrate-flyer";
    flyer.style.setProperty("--hero-color", color);
    flyer.innerHTML = `<span class="fly-num">${opts.number}</span>`;

    Object.assign(flyer.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      borderRadius: "18px",
    });

    document.body.appendChild(flyer);
    activeFlyer = flyer;

    const flyMs = 1300;
    const colorDelay = 950;
    const endBg = `color-mix(in srgb, ${color} 55%, transparent)`;
    let finished = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flyer.style.transition = [
          `left ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1)`,
          `top ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1)`,
          `width ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1)`,
          `height ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1)`,
          `border-radius ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1)`,
          `box-shadow ${flyMs}ms ease`,
          `background ${380}ms ease ${colorDelay}ms`,
          `border-color ${380}ms ease ${colorDelay}ms`,
        ].join(", ");

        flyer.style.left = `${to.left}px`;
        flyer.style.top = `${to.top}px`;
        flyer.style.width = `${to.width}px`;
        flyer.style.height = `${to.height}px`;
        flyer.style.borderRadius = "4px";
        flyer.style.boxShadow = `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`;
        flyer.style.background = endBg;
        flyer.style.borderColor = color;

        const numEl = flyer.querySelector(".fly-num");
        if (numEl) {
          numEl.style.fontSize = `${Math.max(to.height * 0.52, 10)}px`;
          numEl.style.color = "#fff";
          numEl.style.transition = `font-size ${flyMs}ms cubic-bezier(0.42, 0, 0.18, 1), color 380ms ease ${colorDelay}ms`;
        }
      });
    });

    const finish = () => {
      if (finished || !activeFlyer) return;
      finished = true;
      clearTimeout(flyer._timer);
      flyer.classList.add("landed");
      setTimeout(() => {
        removeFlyer();
        resetBanner();
        target.classList.remove("fly-pending");
        target.classList.remove("fly-landed");
        void target.offsetWidth;
        target.classList.add("fly-landed");
      }, 120);
    };

    flyer._timer = setTimeout(finish, flyMs + 450);
    flyer.addEventListener("transitionend", (e) => {
      if (e.propertyName === "background") finish();
    });
  }

  function showBanner(opts) {
    opts = opts || {};
    injectStyles();
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.id = "celebrate-banner";
      bannerEl.innerHTML = `
        <p class="celebrate-en">Congratulations!</p>
        <p class="celebrate-zh">恭喜！</p>
        <p class="celebrate-ja">おめでとうございます！</p>
        <div class="celebrate-hero" aria-hidden="true">
          <div class="celebrate-hero-box">
            <span class="celebrate-letter"></span>
            <span class="celebrate-number"></span>
          </div>
        </div>
        <p class="celebrate-sub"></p>`;
      document.body.appendChild(bannerEl);
    }
    const sub = bannerEl.querySelector(".celebrate-sub");
    const letterEl = bannerEl.querySelector(".celebrate-letter");
    const numberEl = bannerEl.querySelector(".celebrate-number");
    const hasNumber = opts.number != null && opts.number !== "";

    if (hasNumber) {
      bannerEl.classList.add("has-hero");
      bannerEl.style.setProperty("--hero-color", opts.color || "#ffd700");
      if (letterEl) letterEl.textContent = opts.letter || "";
      if (numberEl) {
        numberEl.textContent = String(opts.number);
        numberEl.style.animation = "none";
        void numberEl.offsetWidth;
        numberEl.style.animation = "";
      }
      if (sub) sub.textContent = opts.subtitle || "";
    } else {
      bannerEl.classList.remove("has-hero");
      if (letterEl) letterEl.textContent = "";
      if (numberEl) numberEl.textContent = "";
      if (sub) sub.textContent = opts.subtitle || "";
    }

    bannerEl.classList.remove("show", "hide", "celebrate-fly-prep");
    bannerEl.style.visibility = "";
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
    clearTimeout(bannerEl._hideTimer);

    const holdMs = hasNumber && opts.flyToNumber != null ? 2200 : 2800;
    if (hasNumber && opts.flyToNumber != null) {
      bannerEl._hideTimer = setTimeout(() => flyNumberToCell(opts), holdMs);
    } else {
      bannerEl._hideTimer = setTimeout(fadeBannerOut, holdMs);
    }
  }

  window.showCelebration = function showCelebration(opts) {
    opts = opts || {};
    const intensity = Math.max(1, Math.min(5, opts.intensity || 1));
    startConfetti(intensity);
    showBanner(opts);
  };

  window.addEventListener("resize", () => {
    if (canvas) resizeCanvas();
  });
})();
