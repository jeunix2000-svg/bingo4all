(() => {
  function tr(k, vars) {
    return window.YFC_I18N ? YFC_I18N.t(k, vars) : k;
  }

  const COLOR_KEYS = ["wheel.color_red", "wheel.color_yellow", "wheel.color_blue", "wheel.color_green"];
  const PRIZE_RULES = [
    { colorKey: COLOR_KEYS[0], color: "#e74c3c", amount: 3000, textColor: "#fff" },
    { colorKey: COLOR_KEYS[1], color: "#f1c40f", amount: 5000, textColor: "#333" },
    { colorKey: COLOR_KEYS[2], color: "#3498db", amount: 7000, textColor: "#fff" },
    { colorKey: COLOR_KEYS[3], color: "#2ecc71", amount: 10000, textColor: "#fff" },
  ];

  function fmt(n) {
    const lang = window.YFC_I18N ? YFC_I18N.getLang() : "ja";
    const locale = lang === "zh" ? "zh-CN" : lang === "en" ? "en-US" : "ja-JP";
    return n.toLocaleString(locale);
  }

  function prizeLabel(amount) {
    return tr("wheel.prize_yen", { n: fmt(amount) });
  }

  function colorName(rule) {
    return tr(rule.colorKey);
  }

  const winCounts = [0, 0, 0, 0];
  const STORAGE_KEY = "lucky-portal:wheel";
  const SEG = 12;
  const ARC = (Math.PI * 2) / SEG;

  const canvas = document.getElementById("wheel");
  if (!canvas) return;

  let prizes = buildPrizes();

  function buildPrizes() {
    return Array.from({ length: SEG }, (_, i) => {
      const ruleIndex = i % 4;
      const rule = PRIZE_RULES[ruleIndex];
      return {
        colorName: colorName(rule),
        ruleIndex,
        labelFull: prizeLabel(rule.amount),
      };
    });
  }

  const tableBody = document.getElementById("prize-table-body");

  function renderPrizeTable() {
    if (!tableBody) return;
    tableBody.innerHTML = PRIZE_RULES.map((rule, i) => `
      <tr>
        <td><span class="color-dot" style="background:${rule.color}"></span>${colorName(rule)}</td>
        <td class="amount">${prizeLabel(rule.amount)}</td>
        <td class="win-count" data-rule="${i}">${winCounts[i]}</td>
      </tr>
    `).join("");
  }

  renderPrizeTable();

  function updateWinCount(ruleIndex) {
    winCounts[ruleIndex]++;
    const cell = document.querySelector(`.win-count[data-rule="${ruleIndex}"]`);
    if (cell) cell.textContent = winCounts[ruleIndex];
    saveState();
  }

  function resetWinCounts() {
    for (let i = 0; i < winCounts.length; i++) {
      winCounts[i] = 0;
      const cell = document.querySelector(`.win-count[data-rule="${i}"]`);
      if (cell) cell.textContent = "0";
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        winCounts,
        currentAngle,
        lastResult: resultEl ? resultEl.textContent : "",
        lastResultClass: resultEl ? resultEl.className : "",
      }));
    } catch (_) { /* storage full or disabled */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.winCounts) || data.winCounts.length !== winCounts.length) return false;
      data.winCounts.forEach((count, i) => {
        winCounts[i] = Number(count) || 0;
        const cell = document.querySelector(`.win-count[data-rule="${i}"]`);
        if (cell) cell.textContent = winCounts[i];
      });
      if (typeof data.currentAngle === "number") currentAngle = data.currentAngle;
      if (resultEl && typeof data.lastResult === "string") {
        resultEl.textContent = data.lastResult;
        resultEl.className = data.lastResultClass || "";
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  const ctx = canvas.getContext("2d");
  const btn = document.getElementById("spin-btn");
  const resetBtn = document.getElementById("reset-btn");
  const resultEl = document.getElementById("result");
  const wrap = document.querySelector(".wheel-wrap");

  let currentAngle = 0;
  let spinning = false;
  let activeSpin = null;
  let rafId = null;

  const COMBO_MAX = 5;
  const COMBO_RESET_MS = 2200;
  const STOP_SECONDS = [3, 4, 5, 6, 7, 8];
  let combo = 0;
  let comboResetTimer = null;
  const comboEl = document.getElementById("combo-display");

  function pickStopDurationMs() {
    return STOP_SECONDS[Math.floor(Math.random() * STOP_SECONDS.length)] * 1000;
  }

  function pickStopSeconds() {
    return STOP_SECONDS[Math.floor(Math.random() * STOP_SECONDS.length)];
  }

  function updateComboUI(bump) {
    if (!comboEl) return;
    if (combo < 2) {
      comboEl.classList.remove("visible", "bump");
      comboEl.textContent = "";
      return;
    }
    comboEl.textContent = `${combo} COMBO!`;
    comboEl.classList.add("visible");
    if (bump) {
      comboEl.classList.remove("bump");
      void comboEl.offsetWidth;
      comboEl.classList.add("bump");
    }
  }

  function addCombo() {
    const prev = combo;
    combo = Math.min(COMBO_MAX, combo + 1);
    clearTimeout(comboResetTimer);
    comboResetTimer = setTimeout(() => {
      combo = 0;
      updateComboUI(false);
    }, COMBO_RESET_MS);
    updateComboUI(true);
    return { level: combo, increased: combo > prev };
  }

  function resetCombo() {
    combo = 0;
    clearTimeout(comboResetTimer);
    updateComboUI(false);
  }

  function flashButton(el, level) {
    if (!el || el.disabled) return;
    el.classList.remove("btn-flash", "combo-x3", "combo-x4", "combo-x5");
    void el.offsetWidth;
    el.classList.add("btn-flash");
    if (level >= 5) el.classList.add("combo-x5");
    else if (level >= 4) el.classList.add("combo-x4");
    else if (level >= 3) el.classList.add("combo-x3");
    clearTimeout(el._flashTimer);
    el._flashTimer = setTimeout(() => {
      el.classList.remove("btn-flash", "combo-x3", "combo-x4", "combo-x5");
    }, 560);
  }

  function comboSettings(level) {
    const c = Math.max(1, Math.min(COMBO_MAX, level));
    const stopSec = pickStopSeconds();
    return {
      duration: stopSec * 1000,
      stopSec,
      fullSpins: 4 + Math.floor(Math.random() * 2) + Math.floor((c - 1) * 0.6),
      easePower: Math.max(2.1, 4.2 - (c - 1) * 0.28),
    };
  }

  function easeOutPow(t, power) {
    return 1 - Math.pow(1 - t, power);
  }

  function rotationAtProgress(s, t) {
    return s.totalRotation * easeOutPow(t, s.easePower);
  }

  function boostActiveSpin() {
    if (!activeSpin) return;
    const s = activeSpin;
    const now = performance.now();
    const t = Math.min((now - s.t0) / s.duration, 1);
    const newStart = s.startAngle + rotationAtProgress(s, t);
    const startMod = ((newStart % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = s.targetMod - startMod;
    if (delta <= 0) delta += Math.PI * 2;
    const stopSec = pickStopSeconds();
    s.startAngle = newStart;
    s.t0 = now;
    s.duration = stopSec * 1000;
    s.stopSec = stopSec;
    s.easePower = Math.max(2, s.easePower - 0.28);
    s.totalRotation = (2 + combo * 0.6) * Math.PI * 2 + delta;
  }

  function resize() {
    const size = wrap.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel(currentAngle);
  }

  function drawWheel(angle) {
    const size = wrap.clientWidth;
    const r = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(angle);

    for (let i = 0; i < SEG; i++) {
      const rule = PRIZE_RULES[i % 4];
      const start = i * ARC - Math.PI / 2;
      const end = start + ARC;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = rule.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + ARC / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = rule.textColor;
      ctx.font = `bold ${Math.max(9, size * 0.032)}px sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText(prizeLabel(rule.amount), r - 14, 5);
      ctx.restore();
    }
    ctx.restore();
  }

  function getWinIndexFromAngle(angle) {
    let phi = (-angle) % (Math.PI * 2);
    if (phi < 0) phi += Math.PI * 2;
    return Math.floor(phi / ARC) % SEG;
  }

  function getTargetAngle(winIndex) {
    return (Math.PI * 2 - winIndex * ARC - ARC / 2) % (Math.PI * 2);
  }

  function spin(comboLevel) {
    if (spinning) return;
    spinning = true;
    resultEl.textContent = "";
    resultEl.className = "";

    const settings = comboSettings(comboLevel || 1);
    const winIndex = Math.floor(Math.random() * SEG);
    const targetMod = getTargetAngle(winIndex);
    const fullSpins = settings.fullSpins;
    const startAngle = currentAngle;
    const startMod = ((startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = targetMod - startMod;
    if (delta <= 0) delta += Math.PI * 2;
    const totalRotation = fullSpins * Math.PI * 2 + delta;
    const duration = settings.duration;
    const t0 = performance.now();

    activeSpin = {
      startAngle,
      totalRotation,
      duration,
      stopSec: settings.stopSec,
      easePower: settings.easePower,
      t0,
      targetMod,
    };

    function frame(now) {
      if (!activeSpin) return;
      const s = activeSpin;
      const elapsed = now - s.t0;
      const t = Math.min(elapsed / s.duration, 1);
      currentAngle = s.startAngle + s.totalRotation * easeOutPow(t, s.easePower);
      drawWheel(currentAngle);

      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        currentAngle = s.startAngle + s.totalRotation;
        drawWheel(currentAngle);
        spinning = false;
        activeSpin = null;
        const prize = prizes[getWinIndexFromAngle(currentAngle)];
        updateWinCount(prize.ruleIndex);
        const comboNote = combo >= 2 ? tr("wheel.combo_note", { n: combo }) : "";
        resultEl.textContent = tr("wheel.win_msg", {
          prize: prize.labelFull,
          color: prize.colorName,
          combo: comboNote,
        });
        resultEl.className = "win";
        if (typeof showCelebration === "function") {
          showCelebration({
            subtitle: `${prize.labelFull} (${prize.colorName})`,
            intensity: combo,
          });
        }
        saveState();
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  function triggerSpin() {
    const { level, increased } = addCombo();
    flashButton(btn, level);
    if (typeof flashScreenCombo === "function") flashScreenCombo(level);
    if (spinning) {
      if (increased) boostActiveSpin();
      return;
    }
    spin(level);
  }

  function reset() {
    if (spinning) return;
    currentAngle = 0;
    drawWheel(0);
    resetWinCounts();
    resetCombo();
    for (let i = 1; i <= 5; i++) document.body.classList.remove(`screen-combo-${i}`);
    resultEl.textContent = "";
    resultEl.className = "";
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function refreshWheelUi() {
    prizes = buildPrizes();
    renderPrizeTable();
    drawWheel(currentAngle);
  }

  document.addEventListener("portal-lang-change", refreshWheelUi);

  btn.classList.add("is-ready");
  btn.addEventListener("click", triggerSpin);
  if (resetBtn) resetBtn.addEventListener("click", reset);
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    if (e.target.matches("input, textarea, select")) return;
    e.preventDefault();
    triggerSpin();
  });
  window.addEventListener("resize", resize);
  loadState();
  resize();
})();
