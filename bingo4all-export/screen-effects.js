(() => {
  const AUTO_THEMES = [
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    "linear-gradient(135deg, #2c0a0a 0%, #5c1a1a 50%, #8b2020 100%)",
    "linear-gradient(135deg, #3d3200 0%, #6b5a00 50%, #9a8200 100%)",
    "linear-gradient(135deg, #0a1a3d 0%, #123a7a 50%, #1a5299 100%)",
    "linear-gradient(135deg, #0a2e1a 0%, #145c32 50%, #1e8449 100%)",
    "linear-gradient(135deg, #2a0a3d 0%, #4a1575 50%, #6a1fa8 100%)",
  ];

  const COMBO_THEMES = [
    "linear-gradient(135deg, #3d3200 0%, #7a6200 45%, #b8860b 100%)",
    "linear-gradient(135deg, #0a1a3d 0%, #1565c0 50%, #42a5f5 100%)",
    "linear-gradient(135deg, #0a2e1a 0%, #1b8a4a 50%, #69f0ae 100%)",
    "linear-gradient(135deg, #4a1800 0%, #e65100 50%, #ffab40 100%)",
    "linear-gradient(135deg, #4a0028 0%, #c2185b 50%, #ff4081 100%)",
  ];

  const FLASH_COLORS = [
    "rgba(255, 215, 0, 0.48)",
    "rgba(33, 150, 243, 0.42)",
    "rgba(76, 175, 80, 0.42)",
    "rgba(255, 152, 0, 0.48)",
    "rgba(233, 30, 99, 0.5)",
  ];

  let useA = true;
  let bgA = null;
  let bgB = null;
  let flashEl = null;
  let autoIndex = 0;

  function crossfadeBackground(gradient) {
    if (!bgA || !bgB) return;
    const next = useA ? bgB : bgA;
    const cur = useA ? bgA : bgB;
    next.style.background = gradient;
    next.classList.add("visible");
    cur.classList.remove("visible");
    useA = !useA;
  }

  function ensureFlashEl() {
    if (flashEl) return flashEl;
    flashEl = document.createElement("div");
    flashEl.id = "screen-flash";
    flashEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(flashEl);
    return flashEl;
  }

  function setBodyComboLevel(level) {
    for (let i = 1; i <= 5; i++) document.body.classList.remove(`screen-combo-${i}`);
    if (level >= 1 && level <= 5) document.body.classList.add(`screen-combo-${level}`);
  }

  window.flashScreenCombo = function flashScreenCombo(comboLevel) {
    const lv = Math.max(1, Math.min(5, comboLevel || 1));
    crossfadeBackground(COMBO_THEMES[lv - 1]);
    setBodyComboLevel(lv);

    const overlay = ensureFlashEl();
    overlay.style.setProperty("--flash-color", FLASH_COLORS[lv - 1]);
    overlay.classList.remove("active", "lv-1", "lv-2", "lv-3", "lv-4", "lv-5");
    void overlay.offsetWidth;
    overlay.classList.add("active", `lv-${lv}`);
    clearTimeout(overlay._flashTimer);
    overlay._flashTimer = setTimeout(() => {
      overlay.classList.remove("active", "lv-1", "lv-2", "lv-3", "lv-4", "lv-5");
    }, 800);
  };

  function initScreenEffects() {
    bgA = document.getElementById("bg-a");
    bgB = document.getElementById("bg-b");
    if (!bgA || !bgB) return;
    bgA.style.background = AUTO_THEMES[0];
    useA = true;

    setInterval(() => {
      autoIndex = (autoIndex + 1) % AUTO_THEMES.length;
      crossfadeBackground(AUTO_THEMES[autoIndex]);
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScreenEffects);
  } else {
    initScreenEffects();
  }
})();
