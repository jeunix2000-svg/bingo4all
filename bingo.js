(() => {
  function tr(k, vars) {
    return window.YFC_I18N ? YFC_I18N.t(k, vars) : k;
  }

  const RANGES = [
    { letter: "B", min: 1, max: 15, color: "#e74c3c" },
    { letter: "I", min: 16, max: 30, color: "#f1c40f" },
    { letter: "N", min: 31, max: 45, color: "#3498db" },
    { letter: "G", min: 46, max: 60, color: "#2ecc71" },
    { letter: "O", min: 61, max: 75, color: "#a29bfe" },
  ];

  const GAMES_KEY = "portal_bingo_games";
  const SESSION_KEY = "portal_bingo_session";
  const CLIENT_ID_KEY = "portal_bingo_client_id";
  const LEGACY_KEY = "lucky-portal:bingo";
  const MAX_ACTIVE_GAMES = 20;
  const DEMO_GAME_ID = "server-demo-bingo";
  const MAX_GAME_DURATION_MS = 5 * 60 * 60 * 1000;
  const HOST_INACTIVITY_IDLE_MS = 3 * 60 * 1000;
  const HOST_INACTIVITY_GRACE_MS = 60 * 1000;
  const HOST_QR_LONG_PRESS_MS = 600;
  const HOST_QR_MARGIN_MODULES = 4;
  const HOST_QR_EXPORT_PX = 512;
  const HOST_QR_EC_LEVEL = () => (typeof QRCode !== "undefined" ? QRCode.CorrectLevel.H : 2);
  const CFG = window.BINGO4ALL_CONFIG || {};
  const SYNC_URL = CFG.bingoSyncUrl || CFG.apiUrl || "scripts/bingo-games.php";
  const LOBBY_POLL_MS = 2000;
  const HOST_GAME_POLL_MS = 1000;
  const SPECTATOR_POLL_FAST_MS = 150;
  const SPECTATOR_POLL_MED_MS = 500;
  const SPECTATOR_POLL_SLOW_MS = 2000;
  const BROADCAST = typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("portal-bingo")
    : null;

  const ballEl = document.getElementById("current-ball");
  const ballLetterEl = document.getElementById("ball-letter");
  const drawBtn = document.getElementById("draw-btn");
  const resetBtn = document.getElementById("reset-btn");
  const statusEl = document.getElementById("host-status");
  const remainEl = document.getElementById("remain-count");
  const calledCountEl = document.getElementById("called-count");
  const participantCountEl = document.getElementById("participant-count");
  const masterBoardEl = document.getElementById("master-board");
  const calledListEl = document.getElementById("called-list");
  const playerCardEl = document.getElementById("player-card");
  const playerCardPanel = document.getElementById("player-card-panel");
  const digitalCardsToggle = document.getElementById("digital-cards-toggle");
  const physicalCardNote = document.getElementById("physical-card-note");
  const claimCardBtn = document.getElementById("claim-card-btn");
  const viewCardBtn = document.getElementById("view-card-btn");
  const claimBingoBtn = document.getElementById("claim-bingo-btn");
  const spectatorCardControls = document.getElementById("spectator-card-controls");
  const winnerBanner = document.getElementById("winner-banner");
  const winnerBannerText = document.getElementById("winner-banner-text");
  const confirmWinnerBtn = document.getElementById("confirm-winner-btn");
  const lobbyEl = document.getElementById("bingo-lobby");
  const gameWrapEl = document.getElementById("bingo-game-wrap");
  const lobbyNewBtn = document.getElementById("lobby-new-btn");
  const lobbyWatchBtn = document.getElementById("lobby-watch-btn");
  const watchPanel = document.getElementById("watch-panel");
  const gameListEl = document.getElementById("game-list");
  const watchEmptyEl = document.getElementById("watch-empty");
  const lobbyLimitText = document.getElementById("lobby-limit-text");
  const backLobbyBtn = document.getElementById("back-lobby-btn");
  const gameBarName = document.getElementById("game-bar-name");
  const gameBarMeta = document.getElementById("game-bar-meta");
  const spectatorBadge = document.getElementById("spectator-badge");
  const comboEl = document.getElementById("combo-display");
  const resumeModal = document.getElementById("resume-modal");
  const resumeGameName = document.getElementById("resume-game-name");
  const resumeModalDesc = document.getElementById("resume-modal-desc");
  const resumeModalMeta = document.getElementById("resume-modal-meta");
  const resumeContinueBtn = document.getElementById("resume-continue-btn");
  const resumeAbortBtn = document.getElementById("resume-abort-btn");
  const resumeDismissBtn = document.getElementById("resume-dismiss-btn");
  const lobbyNotice = document.getElementById("lobby-notice");
  const hostQrPanel = document.getElementById("host-qr-panel");
  const hostQrCodeEl = document.getElementById("host-qr-code");
  const hostQrSaveToast = document.getElementById("host-qr-save-toast");
  const demoSpectatorPanel = document.getElementById("demo-spectator-panel");
  const demoCountdownEl = document.getElementById("demo-countdown");
  const demoCountdownLabel = document.getElementById("demo-countdown-label");
  const demoNewGameBtn = document.getElementById("demo-new-game-btn");
  const inactivityModal = document.getElementById("inactivity-modal");
  const inactivityCountdownEl = document.getElementById("inactivity-countdown");
  const inactivityContinueBtn = document.getElementById("inactivity-continue-btn");

  if (!ballEl) return;

  let pendingResumeSession = null;
  let hostQrGameId = null;
  let hostQrLongPressTimer = null;
  let hostQrSaveToastTimer = null;
  let demoCountdownTimer = null;
  let hostInactivityTimer = null;

  let pool = [];
  let called = [];
  let drawing = false;
  let playerCard = [];
  let playerMarked = [];
  let digitalCardsEnabled = false;
  let spectatorCards = {};
  let pendingWinner = null;
  let confirmedWinners = [];
  let lastCelebratedWinnerKey = null;
  let activeDraw = null;
  let currentGameId = null;
  /** @type {'host'|'spectator'|null} */
  let currentMode = null;
  let spectatorPollTimer = null;
  let lobbyPollTimer = null;
  let spectatorSnapshot = "";
  let spectatorLiveDrawId = null;
  let spectatorAwaitingDrawResult = false;
  let gamesCache = null;
  let syncInFlight = null;
  let remoteSyncEnabled = true;
  let remoteQuota = { ipActiveGames: 0, maxActiveGamesPerIp: 2 };
  let hostGamePollTimer = null;
  let remoteRevision = 0;
  let remoteGameUpdatedAt = 0;

  function snapshotState() {
    return `${called.length}:${called[called.length - 1] ?? ""}:${pool.length}`;
  }

  const COMBO_MAX = 5;
  const COMBO_RESET_MS = 2200;
  const STOP_SECONDS = [3, 4, 5, 6, 7, 8];
  let combo = 0;
  let comboResetTimer = null;

  function formatGameName(date) {
    const d = date instanceof Date ? date : new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function getClientId() {
    try {
      let id = localStorage.getItem(CLIENT_ID_KEY);
      if (!id) {
        id = `host-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      return id;
    } catch (_) {
      return `host-${Date.now()}`;
    }
  }

  function getHostLabel() {
    try {
      return window.location.hostname || "local";
    } catch (_) {
      return "local";
    }
  }

  function getDeviceLabel() {
    try {
      const host = getHostLabel();
      const id = getClientId();
      return `${host}·${id.slice(-5)}`;
    } catch (_) {
      return "device";
    }
  }

  function getSpectatorApiUrl() {
    const base = String(SYNC_URL || "").replace(/\/$/, "");
    if (!base) return "";
    return `${base}/api/spectator`;
  }

  function buildSpectatorJoinUrl(gameId) {
    const appBase = CFG.appBaseUrl;
    const base = appBase
      ? `${String(appBase).replace(/\/$/, "")}/`
      : `${window.location.origin}/`;
    const url = new URL(base);
    url.searchParams.set("watch", String(gameId));
    return url.toString();
  }

  function getHostQrDisplayPx() {
    return window.matchMedia("(max-width: 700px)").matches ? 128 : 160;
  }

  function createHostQrCanvas(text, cssSizePx) {
    if (typeof QRCode === "undefined") return null;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;";
    document.body.appendChild(probe);
    let matrix;
    try {
      const qr = new QRCode(probe, {
        text,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: HOST_QR_EC_LEVEL(),
      });
      matrix = qr._oQRCode;
    } catch (_) {
      probe.remove();
      return null;
    }
    probe.remove();
    if (!matrix) return null;

    const modules = matrix.getModuleCount();
    const framedModules = modules + HOST_QR_MARGIN_MODULES * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const targetPx = Math.max(64, Math.round(cssSizePx * dpr));
    let modulePx = Math.max(2, Math.floor(targetPx / framedModules));
    let canvasSize = framedModules * modulePx;
    if (canvasSize < targetPx) {
      modulePx += 1;
      canvasSize = framedModules * modulePx;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = `${cssSizePx}px`;
    canvas.style.height = `${cssSizePx}px`;
    canvas.setAttribute("aria-hidden", "true");

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#000000";
    const offset = HOST_QR_MARGIN_MODULES * modulePx;
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (!matrix.isDark(row, col)) continue;
        ctx.fillRect(
          offset + col * modulePx,
          offset + row * modulePx,
          modulePx,
          modulePx,
        );
      }
    }
    return canvas;
  }

  function clearWatchParamFromUrl() {
    try {
      if (!window.history.replaceState) return;
      const url = new URL(window.location.href);
      if (!url.searchParams.has("watch")) return;
      url.searchParams.delete("watch");
      window.history.replaceState({}, "", url);
    } catch (_) { /* ignore */ }
  }

  function showHostQrSaveToast(message) {
    if (!hostQrSaveToast) return;
    hostQrSaveToast.textContent = message;
    hostQrSaveToast.hidden = false;
    hostQrSaveToast.classList.add("visible");
    clearTimeout(hostQrSaveToastTimer);
    hostQrSaveToastTimer = setTimeout(() => {
      hostQrSaveToast.classList.remove("visible");
      hostQrSaveToast.hidden = true;
    }, 2200);
  }

  function saveHostQrCode() {
    if (!currentGameId) {
      showHostQrSaveToast(tr("bingo.qr_save_fail"));
      return false;
    }
    try {
      const exportCanvas = createHostQrCanvas(buildSpectatorJoinUrl(currentGameId), HOST_QR_EXPORT_PX);
      if (!exportCanvas) {
        showHostQrSaveToast(tr("bingo.qr_save_fail"));
        return false;
      }
      const link = document.createElement("a");
      link.download = `bingo-watch-${currentGameId}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
      showHostQrSaveToast(tr("bingo.qr_saved"));
      return true;
    } catch (_) {
      showHostQrSaveToast(tr("bingo.qr_save_fail"));
      return false;
    }
  }

  function promptSaveHostQrCode() {
    if (window.confirm(tr("bingo.qr_save_confirm"))) {
      saveHostQrCode();
    }
  }

  function clearHostQrLongPress() {
    clearTimeout(hostQrLongPressTimer);
    hostQrLongPressTimer = null;
    hostQrCodeEl?.classList.remove("is-pressing");
  }

  function bindHostQrInteractions() {
    if (!hostQrCodeEl) return;

    const startLongPress = (e) => {
      if (e.type === "mousedown" && e.button !== 0) return;
      clearHostQrLongPress();
      hostQrCodeEl.classList.add("is-pressing");
      hostQrLongPressTimer = setTimeout(() => {
        hostQrLongPressTimer = null;
        hostQrCodeEl.classList.remove("is-pressing");
        promptSaveHostQrCode();
      }, HOST_QR_LONG_PRESS_MS);
    };

    hostQrCodeEl.addEventListener("touchstart", startLongPress, { passive: true });
    hostQrCodeEl.addEventListener("mousedown", startLongPress);
    hostQrCodeEl.addEventListener("touchend", clearHostQrLongPress);
    hostQrCodeEl.addEventListener("touchmove", clearHostQrLongPress);
    hostQrCodeEl.addEventListener("touchcancel", clearHostQrLongPress);
    hostQrCodeEl.addEventListener("mouseup", clearHostQrLongPress);
    hostQrCodeEl.addEventListener("mouseleave", clearHostQrLongPress);
    hostQrCodeEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      promptSaveHostQrCode();
    });
    hostQrCodeEl.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      promptSaveHostQrCode();
    });
  }

  function updateHostQrCode() {
    if (!hostQrPanel || !hostQrCodeEl) return;
    const show = currentMode === "host" && !!currentGameId && gameWrapEl?.classList.contains("active");
    hostQrPanel.hidden = !show;
    if (!show) {
      hostQrGameId = null;
      hostQrCodeEl.innerHTML = "";
      return;
    }
    const displayPx = getHostQrDisplayPx();
    const renderKey = `${currentGameId}:${displayPx}`;
    if (hostQrGameId === renderKey && hostQrCodeEl.childNodes.length) return;
    if (typeof QRCode === "undefined") {
      hostQrPanel.hidden = true;
      return;
    }
    hostQrGameId = renderKey;
    hostQrCodeEl.innerHTML = "";
    try {
      const canvas = createHostQrCanvas(buildSpectatorJoinUrl(currentGameId), displayPx);
      if (!canvas) {
        hostQrPanel.hidden = true;
        return;
      }
      hostQrCodeEl.appendChild(canvas);
    } catch (_) {
      hostQrPanel.hidden = true;
    }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.gameId || !data.mode) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function saveSession(gameId, mode) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        gameId,
        mode,
        clientId: getClientId(),
        hostLabel: getHostLabel(),
        updatedAt: Date.now(),
      }));
    } catch (_) { /* ignore */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) { /* ignore */ }
  }

  function clearSessionIfGame(gameId) {
    const session = loadSession();
    if (session && session.gameId === gameId) clearSession();
  }

  function isPageReload() {
    const nav = performance.getEntriesByType("navigation")[0];
    return nav && nav.type === "reload";
  }

  function isGameAborted(game) {
    return game?.status === "aborted";
  }

  function isDemoGame(game) {
    return !!(game?.isDemo || game?.id === DEMO_GAME_ID);
  }

  function displayGameName(game) {
    if (isDemoGame(game)) return tr("bingo.demo_game_name");
    const id = game?.id ?? currentGameId;
    return game?.name || formatGameName(Number(id));
  }

  function formatDemoCountdown(totalSec) {
    const sec = Math.max(0, totalSec);
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    return String(sec);
  }

  function stopDemoCountdownTimer() {
    if (demoCountdownTimer) {
      clearInterval(demoCountdownTimer);
      demoCountdownTimer = null;
    }
    if (demoSpectatorPanel) demoSpectatorPanel.hidden = true;
  }

  function updateDemoSpectatorUI() {
    if (!demoSpectatorPanel || !demoCountdownEl) return;
    const game = currentGameId ? loadAllGames()[currentGameId] : null;
    const show = currentMode === "spectator" && isDemoGame(game);
    demoSpectatorPanel.hidden = !show;
    if (!show) return;

    const now = Date.now();
    if (game?.liveDraw?.endsAt && now < game.liveDraw.endsAt) {
      const remain = Math.max(0, Math.ceil((game.liveDraw.endsAt - now) / 1000));
      if (demoCountdownLabel) demoCountdownLabel.textContent = tr("bingo.demo_drawing");
      demoCountdownEl.textContent = tr("bingo.demo_sec", { n: remain });
      return;
    }

    const nextAt = Number(game?.demoNextDrawAt || 0);
    if (demoCountdownLabel) demoCountdownLabel.textContent = tr("bingo.demo_countdown_label");
    if (!nextAt) {
      demoCountdownEl.textContent = "—";
      return;
    }
    const remain = Math.max(0, Math.ceil((nextAt - now) / 1000));
    demoCountdownEl.textContent = formatDemoCountdown(remain);
  }

  function startDemoCountdownTimer() {
    stopDemoCountdownTimer();
    updateDemoSpectatorUI();
    demoCountdownTimer = setInterval(updateDemoSpectatorUI, 250);
  }

  function isGameTimedOut(game) {
    if (isDemoGame(game)) return false;
    if (!game || isGameAborted(game)) return false;
    const created = Number(game.createdAt || 0);
    if (!created) return false;
    if (game.status === "finished" && !(game.pool || []).length) return false;
    return Date.now() - created >= MAX_GAME_DURATION_MS;
  }

  function applyInactivityTimeouts(games) {
    let changed = false;
    const now = Date.now();
    Object.values(games).forEach((game) => {
      if (!game || typeof game !== "object") return;
      if (isDemoGame(game) || isGameAborted(game)) return;
      if (!isGameActive(game)) return;

      const lastActive = Number(game.hostLastActiveAt || game.updatedAt || game.createdAt || 0);

      if (game.inactivityEndsAt) {
        if (now >= Number(game.inactivityEndsAt)) {
          game.status = "finished";
          game.endReason = "inactivity";
          game.endedAt = now;
          game.updatedAt = now;
          game.pool = [];
          game.liveDraw = null;
          game.inactivityEndsAt = null;
          changed = true;
          clearSessionIfGame(game.id);
        }
        return;
      }

      if (lastActive && now - lastActive >= HOST_INACTIVITY_IDLE_MS) {
        game.inactivityEndsAt = now + HOST_INACTIVITY_GRACE_MS;
        game.updatedAt = now;
        changed = true;
      }
    });
    return changed;
  }

  function applyGameTimeouts(games) {
    let changed = false;
    Object.values(games).forEach((game) => {
      if (!game || typeof game !== "object") return;
      if (isDemoGame(game)) return;
      if (!isGameTimedOut(game)) return;
      game.status = "finished";
      game.endReason = "timeout";
      game.endedAt = Date.now();
      game.updatedAt = Date.now();
      game.pool = [];
      changed = true;
      clearSessionIfGame(game.id);
    });
    return changed;
  }

  function isGameActive(game) {
    if (!game || isGameAborted(game)) return false;
    if (isDemoGame(game)) return game.status === "active";
    if (Array.isArray(game.pool) && game.pool.length > 0) return true;
    if (game.liveDraw || game.hasLiveDraw) return true;
    if (typeof game.poolCount === "number" && game.poolCount > 0) return true;
    return false;
  }

  function getActiveGames(games) {
    return Object.values(games)
      .filter(isGameActive)
      .sort((a, b) => {
        if (isDemoGame(a) && !isDemoGame(b)) return -1;
        if (!isDemoGame(a) && isDemoGame(b)) return 1;
        return b.createdAt - a.createdAt;
      });
  }

  function getUserActiveGames(games) {
    return getActiveGames(games).filter((game) => !isDemoGame(game));
  }

  function isSessionHost(session, game) {
    return session?.mode === "host" && game?.hostClientId === getClientId();
  }

  function isGameOwner(game) {
    if (!game || isDemoGame(game)) return false;
    if (game.hostClientId === getClientId()) return true;
    const session = loadSession();
    return session?.mode === "host" && String(session.gameId) === String(game.id);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function readGamesFromStorage() {
    try {
      const raw = localStorage.getItem(GAMES_KEY);
      if (!raw) return migrateLegacyIfNeeded();
      const data = JSON.parse(raw);
      return typeof data === "object" && data !== null ? data : {};
    } catch (_) {
      return {};
    }
  }

  function ensureGamesCache() {
    if (!gamesCache) gamesCache = readGamesFromStorage();
    return gamesCache;
  }

  function loadAllGames() {
    ensureGamesCache();
    let changed = applyInactivityTimeouts(gamesCache);
    if (applyGameTimeouts(gamesCache)) changed = true;
    if (changed) {
      try {
        localStorage.setItem(GAMES_KEY, JSON.stringify(gamesCache));
      } catch (_) { /* ignore */ }
      pushGamesToServer(gamesCache);
    }
    return gamesCache;
  }

  function gameTimestamp(game) {
    return Number(game?.updatedAt || game?.createdAt || 0);
  }

  function mergeSpectatorCards(existing, incoming) {
    const prev = existing && typeof existing === "object" ? existing : {};
    if (!incoming || typeof incoming !== "object") return prev;
    return { ...prev, ...incoming };
  }

  function mergeGameMaps(base, incoming) {
    const merged = { ...base };
    if (!incoming || typeof incoming !== "object") return merged;
    Object.entries(incoming).forEach(([id, game]) => {
      if (!game || typeof game !== "object") return;
      const gid = String(game.id || id);
      if (isDemoGame(game)) {
        merged[gid] = game;
        return;
      }
      if (!merged[gid] || gameTimestamp(game) >= gameTimestamp(merged[gid])) {
        const prev = merged[gid] || {};
        merged[gid] = {
          ...prev,
          ...game,
          spectatorCards: mergeSpectatorCards(prev.spectatorCards, game.spectatorCards),
          pendingWinner: "pendingWinner" in game ? game.pendingWinner : (prev.pendingWinner ?? null),
          confirmedWinners: game.confirmedWinners ?? prev.confirmedWinners ?? [],
        };
      }
    });
    return merged;
  }

  function gamesChanged(a, b) {
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  function notifySyncPeers() {
    try {
      BROADCAST?.postMessage({ type: "sync", t: Date.now() });
    } catch (_) { /* ignore */ }
  }

  function hideInactivityModal() {
    inactivityModal?.classList.remove("open");
  }

  function updateInactivityModal(game) {
    if (!inactivityModal) return;
    if (currentMode !== "host" || !game?.inactivityEndsAt || !isGameActive(game)) {
      hideInactivityModal();
      return;
    }
    const remain = Math.max(0, Math.ceil((Number(game.inactivityEndsAt) - Date.now()) / 1000));
    if (inactivityCountdownEl) {
      inactivityCountdownEl.textContent = tr("bingo.inactivity_countdown", { n: remain });
    }
    inactivityModal.classList.add("open");
    if (remain <= 0) hideInactivityModal();
  }

  function syncInactivityFinale(game) {
    if (!currentGameId || !game?.inactivityEndsAt || !isGameActive(game)) {
      window.stopInactivityFinale?.();
      return;
    }
    const remain = Math.max(0, Math.ceil((Number(game.inactivityEndsAt) - Date.now()) / 1000));
    if (remain <= 15 && remain > 0) {
      window.updateInactivityFinale?.(remain);
    } else {
      window.stopInactivityFinale?.();
    }
  }

  async function continueFromInactivity() {
    if (currentMode !== "host" || !currentGameId) return;
    hideInactivityModal();
    window.stopInactivityFinale?.();
    await pushHostGameState({ hostLastActiveAt: Date.now(), inactivityEndsAt: null });
  }

  function checkHostInactivityState() {
    if (currentMode !== "host" || !currentGameId) return;
    const games = loadAllGames();
    const game = games[currentGameId];
    if (!game) return;
    updateInactivityModal(game);
    syncInactivityFinale(game);
    if (game.endReason === "inactivity" && !isGameActive(game)) {
      hideInactivityModal();
      window.stopInactivityFinale?.();
      handleGameEnded(currentGameId, tr("bingo.notice_inactivity"));
    }
  }

  function startHostInactivityTimer() {
    stopHostInactivityTimer();
    checkHostInactivityState();
    hostInactivityTimer = setInterval(checkHostInactivityState, 1000);
  }

  function stopHostInactivityTimer() {
    if (hostInactivityTimer) {
      clearInterval(hostInactivityTimer);
      hostInactivityTimer = null;
    }
    hideInactivityModal();
    window.stopInactivityFinale?.();
  }

  function refreshUIAfterSync() {
    if (currentGameId) checkCurrentGameStillValid();
    if (currentMode === "spectator") void refreshSpectatorView();
    if (lobbyEl && !lobbyEl.classList.contains("hidden")) updateLobbyUI();
    updateHostQrCode();
    if (currentMode === "host" && currentGameId) {
      updateInactivityModal(loadAllGames()[currentGameId]);
      updateDigitalCardUI();
      updateWinnerUI();
    }
  }

  function applyRemoteQuota(data) {
    if (!data || typeof data !== "object") return;
    if (typeof data.ipActiveGames === "number") remoteQuota.ipActiveGames = data.ipActiveGames;
    if (typeof data.maxActiveGamesPerIp === "number") remoteQuota.maxActiveGamesPerIp = data.maxActiveGamesPerIp;
  }

  function mergeServerGames(serverGames) {
    if (!serverGames || typeof serverGames !== "object") return;
    const merged = mergeGameMaps(ensureGamesCache(), serverGames);
    gamesCache = merged;
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify(gamesCache));
    } catch (_) { /* storage full */ }
  }

  function applyRemoteMeta(data) {
    if (!data || typeof data !== "object") return;
    if (typeof data.revision === "number") remoteRevision = data.revision;
    applyRemoteQuota(data);
  }

  function getSyncBaseUrl() {
    return String(SYNC_URL || "").replace(/\/$/, "");
  }

  function getCalledCount(game) {
    if (!game) return 0;
    if (Array.isArray(game.called)) return game.called.length;
    if (typeof game.calledCount === "number") return game.calledCount;
    return 0;
  }

  function getPoolCount(game) {
    if (!game) return 0;
    if (Array.isArray(game.pool)) return game.pool.length;
    if (typeof game.poolCount === "number") return game.poolCount;
    return 0;
  }

  function mergeSummaryIntoCache(summaries) {
    if (!Array.isArray(summaries)) return false;
    const games = ensureGamesCache();
    let changed = false;
    summaries.forEach((summary) => {
      if (!summary?.id) return;
      const id = String(summary.id);
      const prev = games[id] || {};
      const prevCardCount = countDigitalParticipants(prev);
      const summaryCount = typeof summary.participantCount === "number" ? summary.participantCount : 0;
      const next = {
        ...prev,
        id,
        name: summary.name ?? prev.name,
        isDemo: summary.isDemo ?? prev.isDemo,
        demoOnly: summary.demoOnly ?? prev.demoOnly,
        status: summary.status ?? prev.status,
        hostClientId: summary.hostClientId || prev.hostClientId,
        hostLabel: summary.hostLabel ?? prev.hostLabel,
        createdAt: summary.createdAt ?? prev.createdAt,
        updatedAt: summary.updatedAt ?? prev.updatedAt,
        hostLastActiveAt: summary.hostLastActiveAt ?? prev.hostLastActiveAt,
        inactivityEndsAt: summary.inactivityEndsAt ?? prev.inactivityEndsAt,
        digitalCardsEnabled: "digitalCardsEnabled" in summary
          ? !!summary.digitalCardsEnabled
          : !!prev.digitalCardsEnabled,
        participantCount: Math.max(prevCardCount, summaryCount, prev.participantCount ?? 0),
        calledCount: summary.calledCount,
        poolCount: summary.poolCount,
      };
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        games[id] = next;
        changed = true;
      }
    });
    return changed;
  }

  function mergeSingleRemoteGame(gameId, game) {
    if (!gameId || !game || typeof game !== "object") return false;
    const games = ensureGamesCache();
    const merged = mergeGameMaps(games, { [gameId]: game });
    if (!gamesChanged(merged, games)) return false;
    gamesCache = merged;
    remoteGameUpdatedAt = gameTimestamp(game);
    if (gamesCache[gameId]) {
      gamesCache[gameId].participantCount = countDigitalParticipants(gamesCache[gameId]);
    }
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify(gamesCache));
    } catch (_) { /* storage full */ }
    return true;
  }

  async function fetchJsonWithRevision(url, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
    };
    if (remoteRevision > 0) headers["If-None-Match"] = String(remoteRevision);
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers,
    });
    if (res.status === 304) return { notModified: true };
    if (!res.ok) {
      if (res.status === 404) remoteSyncEnabled = false;
      return { notModified: false, ok: false, status: res.status };
    }
    const etag = res.headers.get("ETag");
    if (etag) remoteRevision = Number(etag) || remoteRevision;
    const data = await res.json();
    applyRemoteMeta(data);
    if (typeof data.revision === "number") remoteRevision = data.revision;
    return { notModified: false, ok: true, data };
  }

  async function fetchRemoteGamesFull() {
    if (!remoteSyncEnabled) return null;
    const base = getSyncBaseUrl();
    if (!base) return null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await fetchJsonWithRevision(`${base}/api/games?t=${Date.now()}`);
        if (result.notModified) return { notModified: true };
        if (!result.ok) return null;
        const games = result.data?.games;
        return games && typeof games === "object" ? games : null;
      } catch (_) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }
    return null;
  }

  async function fetchRemoteSummary() {
    if (!remoteSyncEnabled) return { notModified: false, changed: false };
    const base = getSyncBaseUrl();
    if (!base) return { notModified: false, changed: false };
    try {
      const result = await fetchJsonWithRevision(`${base}/api/games/summary?t=${Date.now()}`);
      if (result.notModified) return { notModified: true, changed: false };
      if (!result.ok) return { notModified: false, changed: false };
      const changed = mergeSummaryIntoCache(result.data?.summaries);
      if (changed) {
        try {
          localStorage.setItem(GAMES_KEY, JSON.stringify(gamesCache));
        } catch (_) { /* storage full */ }
      }
      return { notModified: false, changed };
    } catch (_) {
      return { notModified: false, changed: false };
    }
  }

  async function fetchRemoteGame(gameId, sinceUpdatedAt = 0) {
    if (!remoteSyncEnabled || !gameId) return { notModified: false, changed: false };
    const base = getSyncBaseUrl();
    if (!base) return { notModified: false, changed: false };
    const params = new URLSearchParams({ t: String(Date.now()) });
    if (sinceUpdatedAt > 0) params.set("since", String(sinceUpdatedAt));
    if (remoteRevision > 0) params.set("revision", String(remoteRevision));
    try {
      const result = await fetchJsonWithRevision(`${base}/api/games/${encodeURIComponent(gameId)}?${params}`);
      if (result.notModified) return { notModified: true, changed: false };
      if (!result.ok) return { notModified: false, changed: false };
      const data = result.data;
      if (data?.changed === false) {
        if (typeof data.updatedAt === "number") remoteGameUpdatedAt = data.updatedAt;
        return { notModified: false, changed: false };
      }
      if (data?.changed && data.game) {
        const didChange = mergeSingleRemoteGame(String(gameId), data.game);
        return { notModified: false, changed: didChange };
      }
      return { notModified: false, changed: false };
    } catch (_) {
      return { notModified: false, changed: false };
    }
  }

  async function fetchRemoteGames() {
    const remote = await fetchRemoteGamesFull();
    if (remote && remote.notModified) return { notModified: true };
    return remote;
  }

  async function pushGamesToServer(games) {
    if (!remoteSyncEnabled) return { ok: true };
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ games, clientId: getClientId() }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (res.status === 429 && data?.error === "IP_GAME_LIMIT") {
        applyRemoteMeta(data);
        if (data.games) mergeServerGames(data.games);
        return { ok: false, error: "IP_GAME_LIMIT", max: data.maxActiveGamesPerIp ?? remoteQuota.maxActiveGamesPerIp };
      }
      if (!res.ok) {
        if (res.status === 404) remoteSyncEnabled = false;
        return { ok: false };
      }
      applyRemoteMeta(data);
      if (data?.games) mergeServerGames(data.games);
      if (currentGameId && gamesCache?.[currentGameId]) {
        remoteGameUpdatedAt = gameTimestamp(gamesCache[currentGameId]);
      }
      return { ok: true };
    } catch (_) {
      return { ok: false };
    }
  }

  async function syncFromRemote() {
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      const remote = await fetchRemoteGames();
      if (remote && remote.notModified) return false;
      if (!remote) return false;
      const local = ensureGamesCache();
      const merged = mergeGameMaps(local, remote);
      applyGameTimeouts(merged);
      if (!gamesChanged(merged, gamesCache)) return false;
      gamesCache = merged;
      remoteGameUpdatedAt = gameTimestamp(gamesCache[currentGameId]) || remoteGameUpdatedAt;
      try {
        localStorage.setItem(GAMES_KEY, JSON.stringify(gamesCache));
      } catch (_) { /* storage full */ }
      refreshUIAfterSync();
      return true;
    })().finally(() => {
      syncInFlight = null;
    });
    return syncInFlight;
  }

  async function syncLobbyFromRemote() {
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      const result = await fetchRemoteSummary();
      if (result.notModified) return false;
      applyGameTimeouts(gamesCache);
      if (!result.changed) return false;
      refreshUIAfterSync();
      return true;
    })().finally(() => {
      syncInFlight = null;
    });
    return syncInFlight;
  }

  async function syncCurrentGameFromRemote() {
    if (!currentGameId || syncInFlight) {
      if (syncInFlight) return syncInFlight;
      return false;
    }
    syncInFlight = (async () => {
      const since = remoteGameUpdatedAt || gameTimestamp(gamesCache?.[currentGameId]) || 0;
      const result = await fetchRemoteGame(currentGameId, since);
      if (result.notModified) return false;
      applyGameTimeouts(gamesCache);
      if (!result.changed) return false;
      refreshUIAfterSync();
      return true;
    })().finally(() => {
      syncInFlight = null;
    });
    return syncInFlight;
  }

  function migrateLegacyIfNeeded() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      if (!Array.isArray(data.pool) || !Array.isArray(data.called)) return {};
      const id = String(Date.now());
      const games = {
        [id]: {
          id,
          name: formatGameName(Number(id)),
          createdAt: Number(id),
          status: "active",
          hostClientId: getClientId(),
          hostLabel: getHostLabel(),
          pool: data.pool,
          called: data.called,
          playerCard: data.playerCard || [],
          playerMarked: data.playerMarked || [],
        },
      };
      void saveAllGames(games);
      localStorage.removeItem(LEGACY_KEY);
      return games;
    } catch (_) {
      return {};
    }
  }

  async function saveAllGames(games) {
    applyGameTimeouts(games);
    gamesCache = games;
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    } catch (_) { /* storage full */ }
    const result = await pushGamesToServer(games);
    if (!result.ok && result.error === "IP_GAME_LIMIT") {
      const err = new Error("IP_GAME_LIMIT");
      err.code = "IP_GAME_LIMIT";
      err.max = result.max ?? remoteQuota.maxActiveGamesPerIp;
      throw err;
    }
    notifySyncPeers();
  }

  function normalizeGameState(game) {
    const calledSet = new Set();
    const normalizedCalled = [];
    (game.called || []).forEach((n) => {
      const num = Number(n);
      if (num >= 1 && num <= 75 && !calledSet.has(num)) {
        calledSet.add(num);
        normalizedCalled.push(num);
      }
    });
    const poolFromGame = (game.pool || [])
      .map(Number)
      .filter((n) => n >= 1 && n <= 75 && !calledSet.has(n));
    const poolUnique = [...new Set(poolFromGame)];
    let rebuiltPool = false;
    if (poolUnique.length + normalizedCalled.length < 75) {
      const missing = [];
      for (let i = 1; i <= 75; i++) {
        if (!calledSet.has(i) && !poolUnique.includes(i)) missing.push(i);
      }
      if (missing.length > 0) {
        poolUnique.push(...missing);
        rebuiltPool = true;
      }
    }
    game.called = normalizedCalled;
    game.pool = rebuiltPool ? shuffle(poolUnique) : poolUnique;
    return game;
  }

  function createFreshGameState() {
    const id = String(Date.now());
    const now = Number(id);
    const fullPool = shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
    const clientId = getClientId();
    return {
      id,
      name: formatGameName(now),
      createdAt: now,
      status: "active",
      hostClientId: clientId,
      hostLabel: getHostLabel(),
      updatedAt: now,
      hostLastActiveAt: now,
      inactivityEndsAt: null,
      pool: fullPool,
      called: [],
      digitalCardsEnabled: false,
      spectatorCards: {},
      pendingWinner: null,
      confirmedWinners: [],
    };
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

  function boostActiveDraw() {
    if (!activeDraw) return;
    const stopSec = pickStopSeconds();
    const now = Date.now();
    activeDraw.endsAt = now + stopSec * 1000;
    activeDraw.totalDuration = activeDraw.endsAt - (activeDraw.startedAt || now);
    activeDraw.deadline = performance.now() + stopSec * 1000;
    activeDraw.stopSec = stopSec;
    activeDraw.speedFactor = Math.min(2.8, activeDraw.speedFactor + 0.2);
    void pushLiveDrawTimingUpdate();
  }

  async function pushLiveDrawTimingUpdate() {
    if (!currentGameId || currentMode !== "host" || !activeDraw?.id) return;
    const games = loadAllGames();
    const game = games[currentGameId];
    if (!game?.liveDraw || game.liveDraw.id !== activeDraw.id) return;
    await pushHostGameState({
      liveDraw: {
        ...game.liveDraw,
        endsAt: activeDraw.endsAt,
        startedAt: activeDraw.startedAt,
      },
    });
  }

  function setDrawBtnEnabled(enabled) {
    if (drawBtn) {
      drawBtn.disabled = !enabled;
      drawBtn.classList.toggle("is-ready", enabled);
    }
    if (ballEl) {
      ballEl.classList.toggle("is-draw-ready", currentMode === "host" && (!!pool.length || drawing));
    }
  }

  function getMeta(num) {
    return RANGES.find((r) => num >= r.min && num <= r.max);
  }

  function isCellMarkedForBingo(col, row, card, calledList) {
    if (col === 2 && row === 2) return true;
    const num = card[col][row];
    return num !== null && calledList.includes(num);
  }

  function checkCardBingo(card, calledList) {
    if (!Array.isArray(card) || card.length !== 5) return false;
    for (let row = 0; row < 5; row += 1) {
      let complete = true;
      for (let col = 0; col < 5; col += 1) {
        if (!isCellMarkedForBingo(col, row, card, calledList)) complete = false;
      }
      if (complete) return true;
    }
    for (let col = 0; col < 5; col += 1) {
      let complete = true;
      for (let row = 0; row < 5; row += 1) {
        if (!isCellMarkedForBingo(col, row, card, calledList)) complete = false;
      }
      if (complete) return true;
    }
    let complete = true;
    for (let i = 0; i < 5; i += 1) {
      if (!isCellMarkedForBingo(i, i, card, calledList)) complete = false;
    }
    if (complete) return true;
    complete = true;
    for (let i = 0; i < 5; i += 1) {
      if (!isCellMarkedForBingo(i, 4 - i, card, calledList)) complete = false;
    }
    return complete;
  }

  function hasMySpectatorCard() {
    return !!(spectatorCards[getClientId()]?.playerCard?.length || playerCard?.length);
  }

  function hasConfirmedWin() {
    return (confirmedWinners || []).some((w) => w.clientId === getClientId());
  }

  async function postSpectatorAction(action, data = {}) {
    const url = getSpectatorApiUrl();
    if (!url || !currentGameId) return { ok: false };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          gameId: currentGameId,
          clientId: getClientId(),
          action,
          data,
        }),
      });
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      if (payload?.games) mergeServerGames(payload.games);
      return { ok: res.ok, error: payload?.error, data: payload };
    } catch (_) {
      return { ok: false };
    }
  }

  function canParticipateDigitalCards() {
    const game = currentGameId ? loadAllGames()[currentGameId] : null;
    if (!game || isDemoGame(game)) return false;
    if (!digitalCardsEnabled) return false;
    return currentMode === "spectator" || currentMode === "host";
  }

  function loadMyDigitalCard() {
    const mine = spectatorCards[getClientId()];
    if (digitalCardsEnabled && mine?.playerCard?.length) {
      playerCard = mine.playerCard;
      playerMarked = mine.playerMarked?.length ? mine.playerMarked : buildPlayerCard().playerMarked;
    } else {
      playerCard = [];
      playerMarked = [];
    }
  }

  async function claimSpectatorCard() {
    if (!canParticipateDigitalCards() || hasMySpectatorCard()) return;
    const built = buildPlayerCard();
    playerCard = built.playerCard;
    playerMarked = built.playerMarked;
    const result = await postSpectatorAction("claimCard", {
      deviceLabel: getDeviceLabel(),
      playerCard,
      playerMarked,
    });
    if (!result.ok) {
      alert(tr("bingo.alert_claim_card_fail"));
      return;
    }
    await syncCurrentGameFromRemote();
    const game = loadAllGames()[currentGameId];
    if (game) applyGameState(game);
    renderPlayerCard();
    playerCardPanel?.classList.add("open");
    updateDigitalCardUI();
  }

  async function claimSpectatorBingo() {
    if (!canParticipateDigitalCards() || !hasMySpectatorCard()) return;
    if (!checkCardBingo(playerCard, called)) return;
    const result = await postSpectatorAction("claimBingo", { hasBingo: true });
    if (!result.ok) {
      alert(tr("bingo.alert_claim_bingo_fail"));
      return;
    }
    await syncCurrentGameFromRemote();
    const game = loadAllGames()[currentGameId];
    if (game) {
      applyGameState(game);
      updateWinnerUI();
    }
  }

  async function confirmPendingWinner() {
    if (currentMode !== "host" || !pendingWinner || !currentGameId) return;
    const games = loadAllGames();
    const existing = games[currentGameId] || {};
    const nextConfirmed = [...(existing.confirmedWinners || confirmedWinners || []), {
      ...pendingWinner,
      confirmedAt: Date.now(),
    }];
    confirmedWinners = nextConfirmed;
    pendingWinner = null;
    lastCelebratedWinnerKey = null;
    await pushHostGameState({
      pendingWinner: null,
      confirmedWinners: nextConfirmed,
    });
    updateWinnerUI();
  }

  function showWinnerCelebrationOnce(winner) {
    if (!winner) return;
    const key = `${winner.clientId}-${winner.claimedAt}`;
    if (lastCelebratedWinnerKey === key) return;
    lastCelebratedWinnerKey = key;
    if (typeof showCelebration === "function") {
      showCelebration({
        subtitle: tr("bingo.winner_celebrate"),
        intensity: 5,
      });
    }
  }

  function updateDigitalCardUI() {
    const enabled = canParticipateDigitalCards();
    document.body.classList.toggle("host-digital-cards", currentMode === "host" && !!digitalCardsEnabled);

    if (spectatorCardControls) spectatorCardControls.hidden = !enabled;

    if (claimCardBtn) claimCardBtn.hidden = !enabled || hasMySpectatorCard() || !!pendingWinner;
    if (viewCardBtn) viewCardBtn.hidden = !enabled || !hasMySpectatorCard();
    if (claimBingoBtn) {
      const canClaim = enabled
        && hasMySpectatorCard()
        && !hasConfirmedWin()
        && !pendingWinner
        && checkCardBingo(playerCard, called);
      claimBingoBtn.hidden = !canClaim;
    }

    if (currentMode === "host") {
      if (digitalCardsToggle) digitalCardsToggle.checked = !!digitalCardsEnabled;
      if (physicalCardNote) physicalCardNote.hidden = !!digitalCardsEnabled;
    }
    updateParticipantDisplay();
  }

  function updateWinnerUI() {
    const hasPending = !!pendingWinner;
    const isSelf = hasPending && pendingWinner.clientId === getClientId();

    if (winnerBanner) winnerBanner.classList.toggle("visible", hasPending);
    if (winnerBannerText) {
      winnerBannerText.classList.toggle("is-self", isSelf);
      if (!hasPending) {
        winnerBannerText.textContent = "";
      } else if (isSelf) {
        winnerBannerText.textContent = tr("bingo.winner_self_msg");
        showWinnerCelebrationOnce(pendingWinner);
      } else if (currentMode === "host") {
        winnerBannerText.textContent = tr("bingo.winner_host_msg", { name: pendingWinner.deviceLabel });
      } else {
        winnerBannerText.textContent = tr("bingo.winner_other_msg", { name: pendingWinner.deviceLabel });
      }
    }
    if (confirmWinnerBtn) confirmWinnerBtn.hidden = currentMode !== "host" || !hasPending;
    updateDigitalCardUI();
  }

  function renderMasterBoard() {
    masterBoardEl.innerHTML = RANGES.map((range) => {
      const nums = Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);
      const cells = nums.map((n) => {
        const isCalled = called.includes(n);
        const isLatest = called.length && called[called.length - 1] === n;
        const cls = ["master-cell", isCalled ? "called" : "", isLatest ? "latest" : ""].filter(Boolean).join(" ");
        return `<div class="${cls}" data-bingo-num="${n}" style="--col-color:${range.color}">${n}</div>`;
      }).join("");
      return `
        <div class="master-col">
          <div class="master-col-head" style="color:${range.color}">${range.letter}</div>
          <div class="master-col-grid">${cells}</div>
        </div>`;
    }).join("");
  }

  function renderCalledList() {
    if (!calledListEl) return;
    if (!called.length) {
      calledListEl.innerHTML = "";
      return;
    }
    calledListEl.innerHTML = [...called].reverse().map((n, i) => {
      const meta = getMeta(n);
      const latest = i === 0 ? " latest-chip" : "";
      return `<span class="called-chip${latest}" style="border-color:${meta.color};color:${meta.color}">${meta.letter}-${n}</span>`;
    }).join("");
  }

  function buildSpectatorSnapshot(game) {
    const liveDrawId = game?.liveDraw?.id || "";
    const pendingId = game?.pendingWinner?.clientId || "";
    const cardsOn = game?.digitalCardsEnabled ? "1" : "0";
    const myCard = game?.spectatorCards?.[getClientId()] ? "1" : "0";
    const participants = Object.keys(game?.spectatorCards || {}).length;
    return `${game?.called?.length ?? 0}:${game?.called?.[game.called.length - 1] ?? ""}:${game?.pool?.length ?? 0}:${liveDrawId}:${pendingId}:${cardsOn}:${myCard}:${participants}`;
  }

  async function pushHostGameState(patch = {}) {
    if (!currentGameId || currentMode !== "host") return;
    const games = loadAllGames();
    const existing = games[currentGameId] || {};
    const finished = pool.length === 0 && called.length > 0;
    const nextLiveDraw = "liveDraw" in patch ? patch.liveDraw : (existing.liveDraw ?? null);
    const gameState = normalizeGameState({
      ...existing,
      ...patch,
      id: currentGameId,
      name: existing.name || formatGameName(Number(currentGameId)),
      createdAt: existing.createdAt || Number(currentGameId),
      status: "status" in patch ? patch.status : (finished ? "finished" : (existing.status || "active")),
      hostClientId: existing.hostClientId || getClientId(),
      hostLabel: existing.hostLabel || getHostLabel(),
      updatedAt: Date.now(),
      hostLastActiveAt: Date.now(),
      inactivityEndsAt: null,
      pool: [...pool],
      called: [...called],
      digitalCardsEnabled: "digitalCardsEnabled" in patch
        ? !!patch.digitalCardsEnabled
        : !!existing.digitalCardsEnabled,
      pendingWinner: "pendingWinner" in patch ? patch.pendingWinner : (existing.pendingWinner ?? null),
      confirmedWinners: patch.confirmedWinners ?? existing.confirmedWinners ?? [],
      liveDraw: nextLiveDraw,
    });
    if ("spectatorCards" in patch) {
      gameState.spectatorCards = patch.spectatorCards;
    } else if (existing.spectatorCards) {
      gameState.spectatorCards = existing.spectatorCards;
    }
    gameState.participantCount = countDigitalParticipants(gameState);
    games[currentGameId] = gameState;
    await saveAllGames(games);
    if (finished) clearSessionIfGame(currentGameId);
  }

  function persistCurrentGame() {
    if (!currentGameId || currentMode !== "host") return;
    void pushHostGameState({ liveDraw: null });
  }

  function applyGameState(game) {
    const g = normalizeGameState({ ...game });
    pool = [...g.pool];
    called = [...g.called];
    digitalCardsEnabled = !!g.digitalCardsEnabled;
    spectatorCards = g.spectatorCards || {};
    pendingWinner = g.pendingWinner || null;
    confirmedWinners = g.confirmedWinners || [];
    if (currentMode === "spectator" || currentMode === "host") {
      loadMyDigitalCard();
    } else {
      playerCard = [];
      playerMarked = [];
    }
  }

  function restoreDisplay() {
    if (called.length) {
      showBall(called[called.length - 1]);
    } else {
      ballLetterEl.textContent = "—";
      ballLetterEl.style.color = "#ffd700";
      ballEl.textContent = "START";
      ballEl.style.borderColor = "rgba(255,215,0,0.7)";
      ballEl.style.boxShadow = "0 0 40px rgba(255,215,0,0.25), 0 10px 40px rgba(0,0,0,0.4)";
    }
    renderMasterBoard();
    renderCalledList();
    updateStats();
    if (canParticipateDigitalCards() && hasMySpectatorCard()) {
      renderPlayerCard();
    } else if (playerCardEl) {
      playerCardEl.innerHTML = "";
    }
    if (currentMode === "host") {
      setDrawBtnEnabled(!!pool.length && !drawing);
    }
    updateDigitalCardUI();
    updateWinnerUI();
    updateGameBar();
  }

  function countDigitalParticipants(game) {
    return Object.values(game?.spectatorCards || {}).filter((entry) => entry?.playerCard?.length).length;
  }

  function getGameParticipantCount(game) {
    if (!game?.digitalCardsEnabled) return null;
    const fromCards = countDigitalParticipants(game);
    if (fromCards > 0) return fromCards;
    if (typeof game.participantCount === "number") return game.participantCount;
    return 0;
  }

  function formatGameParticipantCount(game) {
    const count = getGameParticipantCount(game);
    return count === null ? "—" : String(count);
  }

  function getParticipantCount() {
    if (!currentGameId) return null;
    return getGameParticipantCount(loadAllGames()[currentGameId]);
  }

  function updateParticipantDisplay() {
    const count = getParticipantCount();
    if (participantCountEl) {
      participantCountEl.textContent = count === null ? "—" : String(count);
    }
  }

  function updateStats() {
    remainEl.textContent = pool.length;
    calledCountEl.textContent = called.length;
    updateParticipantDisplay();
    statusEl.textContent = pool.length
      ? tr("bingo.status_remain", { n: pool.length })
      : tr("bingo.status_all_called");
    updateGameBar();
  }

  function updateGameBar() {
    if (!gameBarName || !currentGameId) return;
    const games = loadAllGames();
    const game = games[currentGameId];
    const name = displayGameName(game);
    gameBarName.textContent = name;
    if (gameBarMeta) {
      const count = getParticipantCount();
      gameBarMeta.textContent = tr("bingo.game_bar_meta", {
        called: called.length,
        pool: pool.length,
        n: count === null ? "—" : count,
      });
    }
  }

  function previewBall(num) {
    const meta = getMeta(num);
    ballLetterEl.textContent = meta.letter;
    ballLetterEl.style.color = meta.color;
    ballEl.textContent = num;
    ballEl.style.borderColor = meta.color;
    ballEl.style.boxShadow = `0 0 40px ${meta.color}44, 0 10px 40px rgba(0,0,0,0.45)`;
  }

  function showBall(num) {
    ballEl.classList.remove("spinning");
    const meta = getMeta(num);
    ballLetterEl.textContent = meta.letter;
    ballLetterEl.style.color = meta.color;
    ballEl.textContent = num;
    ballEl.style.borderColor = meta.color;
    ballEl.style.boxShadow = `0 0 40px ${meta.color}66, 0 10px 40px rgba(0,0,0,0.45)`;
    ballEl.classList.remove("pop");
    void ballEl.offsetWidth;
    ballEl.classList.add("pop");
  }

  function spinAnimation(finalNum, candidates, comboLevel, animState) {
    return new Promise((resolve) => {
      const c = Math.max(1, Math.min(COMBO_MAX, comboLevel || 1));
      animState.done = false;
      animState.finalNum = finalNum;
      animState.candidates = candidates;
      if (!animState.speedFactor) {
        animState.speedFactor = 1 + (c - 1) * 0.2;
      }
      if (!animState.totalDuration || !animState.deadline) {
        const stopSec = pickStopSeconds();
        animState.totalDuration = stopSec * 1000;
        animState.stopSec = stopSec;
        animState.deadline = performance.now() + animState.totalDuration;
        animState.startedAt = Date.now();
        animState.endsAt = animState.startedAt + animState.totalDuration;
      }

      ballEl.classList.add("spinning");

      function tick() {
        if (animState.done) return;
        const now = performance.now();
        const remain = animState.deadline - now;

        if (remain <= 0) {
          animState.done = true;
          showBall(finalNum);
          resolve();
          return;
        }

        const t = 1 - remain / animState.totalDuration;
        const display = remain < 120
          ? finalNum
          : candidates[Math.floor(Math.random() * candidates.length)];
        previewBall(display);

        const delay = Math.max(18, (30 + Math.pow(t, 2.5) * 280) / animState.speedFactor);
        animState.timerId = setTimeout(tick, delay);
      }

      tick();
    });
  }

  function pickColumn(col) {
    const range = RANGES[col];
    const nums = [];
    for (let n = range.min; n <= range.max; n++) nums.push(n);
    return shuffle(nums).slice(0, 5);
  }

  function buildPlayerCard() {
    const card = RANGES.map((_, col) => pickColumn(col));
    card[2][2] = null;
    const marked = card.map((col) => col.map(() => false));
    marked[2][2] = true;
    return { playerCard: card, playerMarked: marked };
  }

  function generatePlayerCard() {
    const built = buildPlayerCard();
    playerCard = built.playerCard;
    playerMarked = built.playerMarked;
    renderPlayerCard();
  }

  function renderPlayerCard() {
    if (!playerCardEl || !hasMySpectatorCard()) {
      if (playerCardEl) playerCardEl.innerHTML = "";
      return;
    }
    let html = '<div class="mini-header">';
    RANGES.forEach((r) => { html += `<span style="color:${r.color}">${r.letter}</span>`; });
    html += '</div><div class="mini-grid">';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const isFree = row === 2 && col === 2;
        const num = playerCard[col][row];
        const marked = isFree || (num !== null && called.includes(num));
        const cls = ["mini-cell", marked ? "marked" : "", isFree ? "free" : ""].filter(Boolean).join(" ");
        html += `<div class="${cls}">`;
        html += isFree ? "FREE" : num;
        html += "</div>";
      }
    }
    html += "</div>";
    playerCardEl.innerHTML = html;
  }

  function autoMarkPlayerCard() {
    if (!hasMySpectatorCard()) return;
    renderPlayerCard();
    updateDigitalCardUI();
  }

  function drawFromPool() {
    if (!pool.length) return null;
    for (let attempt = 0; attempt < pool.length + 5; attempt += 1) {
      const idx = Math.floor(Math.random() * pool.length);
      const num = pool[idx];
      pool.splice(idx, 1);
      if (!called.includes(num)) return num;
    }
    return null;
  }

  async function drawNumber(comboLevel) {
    if (currentMode !== "host" || drawing || !pool.length) return;
    drawing = true;
    setDrawBtnEnabled(false);

    const num = drawFromPool();
    if (num === null) {
      drawing = false;
      setDrawBtnEnabled(false);
      return;
    }

    const candidates = [...pool, num];
    const level = comboLevel || 1;
    const c = Math.max(1, Math.min(COMBO_MAX, level));
    const stopSec = pickStopSeconds();
    const startedAt = Date.now();
    const endsAt = startedAt + stopSec * 1000;
    const liveDrawId = `${currentGameId}-${startedAt}`;

    void pushHostGameState({
      liveDraw: {
        id: liveDrawId,
        num,
        startedAt,
        endsAt,
        comboLevel: level,
        poolSnapshot: candidates,
      },
    });

    activeDraw = {
      done: false,
      speedFactor: 1 + (c - 1) * 0.2,
      totalDuration: endsAt - startedAt,
      deadline: performance.now() + stopSec * 1000,
      stopSec,
      timerId: null,
      id: liveDrawId,
      startedAt,
      endsAt,
    };

    await spinAnimation(num, candidates, level, activeDraw);
    activeDraw = null;

    if (!called.includes(num)) {
      called.push(num);
    }
    pool = pool.filter((n) => !called.includes(n));

    renderMasterBoard();
    renderCalledList();
    updateStats();
    autoMarkPlayerCard();

    const meta = getMeta(num);
    if (typeof showCelebration === "function") {
      showCelebration({
        number: num,
        letter: meta.letter,
        color: meta.color,
        subtitle: !pool.length ? "BINGO!" : "",
        intensity: combo,
        flyToNumber: num,
      });
    }

    if (!pool.length) {
      setDrawBtnEnabled(false);
      const comboNote = combo >= 2 ? ` (${combo} COMBO!)` : "";
      statusEl.textContent = tr("bingo.status_bingo", { combo: comboNote });
      clearSessionIfGame(currentGameId);
    } else {
      setDrawBtnEnabled(true);
      if (combo >= 2) {
        statusEl.textContent = tr("bingo.status_combo", { n: pool.length, combo });
      }
    }
    drawing = false;
    await pushHostGameState({ liveDraw: null });
  }

  function triggerDraw() {
    if (currentMode !== "host") return;
    const { level, increased } = addCombo();
    flashButton(drawBtn, level);
    if (typeof flashScreenCombo === "function") flashScreenCombo(level);
    if (drawing) {
      if (increased) boostActiveDraw();
      return;
    }
    if (!pool.length) return;
    drawNumber(level);
  }

  function resetCurrentGame() {
    if (currentMode !== "host") return;
    resetCombo();
    for (let i = 1; i <= 5; i++) document.body.classList.remove(`screen-combo-${i}`);
    pool = shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
    called = [];
    ballLetterEl.textContent = "—";
    ballLetterEl.style.color = "#ffd700";
    ballEl.textContent = "START";
    ballEl.style.borderColor = "rgba(255,215,0,0.7)";
    ballEl.style.boxShadow = "0 0 40px rgba(255,215,0,0.25), 0 10px 40px rgba(0,0,0,0.4)";
    renderMasterBoard();
    renderCalledList();
    updateStats();
    setDrawBtnEnabled(true);
    updateDigitalCardUI();
    updateWinnerUI();
    persistCurrentGame();
  }

  function updateLobbyWatchBtn(activeCount) {
    if (!lobbyWatchBtn) return;
    lobbyWatchBtn.textContent = activeCount > 0
      ? tr("bingo.watch_btn_count", { n: activeCount })
      : tr("bingo.lobby_watch");
  }

  function updateLobbyUI() {
    const games = loadAllGames();
    const active = getActiveGames(games);
    const userActive = getUserActiveGames(games);
    if (lobbyLimitText) {
      lobbyLimitText.textContent = tr("bingo.lobby_limit_tpl", { n: userActive.length, max: MAX_ACTIVE_GAMES });
    }
    updateLobbyWatchBtn(active.length);
    if (lobbyNewBtn) {
      lobbyNewBtn.disabled = userActive.length >= MAX_ACTIVE_GAMES;
      lobbyNewBtn.title = userActive.length >= MAX_ACTIVE_GAMES
        ? tr("bingo.new_game_limit_title")
        : "";
    }
    if (watchPanel && !watchPanel.hidden) {
      renderGameList(active);
    }
  }

  function formatGameListMeta(game) {
    const host = escapeHtml(game.hostLabel || getHostLabel());
    const called = getCalledCount(game);
    const poolLeft = getPoolCount(game);
    const now = Date.now();
    const lastActive = Number(game.hostLastActiveAt || game.updatedAt || game.createdAt || 0);

    if (game.inactivityEndsAt && now < Number(game.inactivityEndsAt)) {
      const sec = Math.max(0, Math.ceil((Number(game.inactivityEndsAt) - now) / 1000));
      return tr("bingo.game_meta_warning", { host, called, pool: poolLeft, sec });
    }

    const untilEndMs = Math.max(0, lastActive + HOST_INACTIVITY_IDLE_MS + HOST_INACTIVITY_GRACE_MS - now);
    const min = Math.max(1, Math.ceil(untilEndMs / 60000));
    return tr("bingo.game_meta", { host, called, pool: poolLeft, min });
  }

  function renderGameList(activeGames) {
    if (!gameListEl) return;
    gameListEl.innerHTML = "";
    if (!activeGames.length) {
      if (watchEmptyEl) watchEmptyEl.hidden = false;
      return;
    }
    if (watchEmptyEl) watchEmptyEl.hidden = true;

    activeGames.forEach((game) => {
      const li = document.createElement("li");
      const demo = isDemoGame(game);
      li.className = demo ? "game-list-item demo-game" : "game-list-item";
      const isOwner = isGameOwner(game);
      const meta = demo
        ? tr("bingo.game_meta_demo", { host: escapeHtml(game.hostLabel || "Portal Server"), called: getCalledCount(game), pool: getPoolCount(game) })
        : formatGameListMeta(game);
      const players = formatGameParticipantCount(game);
      li.innerHTML = `
        <div>
          <div class="game-name">${escapeHtml(displayGameName(game))}${demo ? ` <span class="demo-badge">${escapeHtml(tr("bingo.demo_badge"))}</span>` : ""}</div>
          <div class="game-meta">${meta}</div>
        </div>
        <div class="game-list-players" aria-label="${tr("bingo.participants_label")}">
          <strong>${players}</strong>
        </div>
        <div class="game-list-actions">
          ${isOwner ? `<button type="button" class="btn-end-game">${tr("bingo.end_game")}</button>` : ""}
          <span class="watch-badge">${isOwner ? tr("bingo.continue_game") : tr("bingo.watch_game")}</span>
        </div>`;
      li.querySelector(".btn-end-game")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm(tr("bingo.confirm_end_game"))) return;
        endGameByHost(game.id);
      });
      li.addEventListener("click", () => {
        void enterGame(game.id, isOwner ? "host" : "spectator");
      });
      gameListEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showLobbyNotice(message) {
    if (!lobbyNotice) return;
    if (!message) {
      lobbyNotice.classList.add("hidden");
      lobbyNotice.textContent = "";
      return;
    }
    lobbyNotice.textContent = message;
    lobbyNotice.classList.remove("hidden");
  }

  function hideResumeModal() {
    pendingResumeSession = null;
    resumeModal?.classList.remove("open");
  }

  function showResumeModal(game, session) {
    pendingResumeSession = session;
    if (lobbyEl) lobbyEl.classList.add("hidden");
    if (gameWrapEl) gameWrapEl.classList.remove("active");
    if (resumeGameName) resumeGameName.textContent = displayGameName(game);
    if (resumeModalMeta) {
      resumeModalMeta.textContent = tr("bingo.resume_meta", { called: game.called.length, pool: game.pool.length });
    }

    const isHost = isSessionHost(session, game);
    if (resumeModalDesc) {
      resumeModalDesc.textContent = isHost
        ? tr("bingo.resume_desc_host")
        : tr("bingo.resume_desc_spectator");
    }
    if (resumeContinueBtn) {
      resumeContinueBtn.textContent = isHost ? tr("bingo.resume_continue_host") : tr("bingo.resume_continue_spectator");
    }
    if (resumeAbortBtn) {
      resumeAbortBtn.hidden = !isHost;
      resumeAbortBtn.textContent = tr("bingo.resume_abort");
    }
    if (resumeDismissBtn) {
      resumeDismissBtn.textContent = isHost ? tr("bingo.resume_dismiss_host") : tr("bingo.resume_dismiss_spectator");
    }
    resumeModal?.classList.add("open");
  }

  function endGameByHost(gameId) {
    const games = loadAllGames();
    const game = games[gameId];
    if (!game || isDemoGame(game) || !isGameOwner(game)) return false;
    if (isGameAborted(game) || (!isGameActive(game) && game.status === "finished")) return false;

    if (!game.hostClientId) game.hostClientId = getClientId();

    game.status = "finished";
    game.endReason = "host";
    game.endedAt = Date.now();
    game.updatedAt = Date.now();
    game.pool = [];
    game.liveDraw = null;
    game.inactivityEndsAt = null;
    games[gameId] = game;
    void saveAllGames(games);
    clearSessionIfGame(gameId);

    const wasInGame = currentGameId === gameId;
    if (wasInGame) {
      currentGameId = null;
      currentMode = null;
      drawing = false;
      activeDraw = null;
      stopSpectatorPoll();
      document.body.classList.remove("spectator-mode");
      if (spectatorBadge) spectatorBadge.hidden = true;
      void showLobby(tr("bingo.notice_game_ended"));
    } else {
      updateLobbyUI();
    }
    return true;
  }

  function abortGame(gameId, { notifyHost = false } = {}) {
    const games = loadAllGames();
    const game = games[gameId];
    if (!game || isGameAborted(game)) return false;

    game.status = "aborted";
    game.abortedAt = Date.now();
    game.updatedAt = Date.now();
    game.pool = [];
    game.liveDraw = null;
    games[gameId] = game;
    void saveAllGames(games);
    clearSessionIfGame(gameId);

    const wasInGame = currentGameId === gameId;
    if (wasInGame) {
      currentGameId = null;
      currentMode = null;
      drawing = false;
      activeDraw = null;
      stopSpectatorPoll();
      document.body.classList.remove("spectator-mode");
      if (spectatorBadge) spectatorBadge.hidden = true;
    }

    if (wasInGame || notifyHost) {
      void showLobby(
        notifyHost
          ? tr("bingo.notice_game_aborted")
          : tr("bingo.notice_host_aborted"),
      );
    }
    return true;
  }

  function handleGameEnded(gameId, message) {
    if (currentGameId !== gameId) return;
    window.stopInactivityFinale?.();
    stopSpectatorPoll();
    clearSession();
    currentGameId = null;
    currentMode = null;
    drawing = false;
    activeDraw = null;
    document.body.classList.remove("spectator-mode");
    if (spectatorBadge) spectatorBadge.hidden = true;
    void showLobby(message);
  }

  function handleGameAborted(gameId) {
    if (currentGameId !== gameId) return;
    const session = loadSession();
    const wasHost = session?.mode === "host";
    stopSpectatorPoll();
    clearSession();
    currentGameId = null;
    currentMode = null;
    drawing = false;
    activeDraw = null;
    document.body.classList.remove("spectator-mode");
    if (spectatorBadge) spectatorBadge.hidden = true;
    void showLobby(
      wasHost
        ? tr("bingo.notice_game_aborted")
        : tr("bingo.notice_host_aborted"),
    );
  }

  async function showLobby(noticeMessage) {
    stopSpectatorPoll();
    stopHostGamePoll();
    stopDemoCountdownTimer();
    stopHostInactivityTimer();
    currentGameId = null;
    currentMode = null;
    drawing = false;
    activeDraw = null;
    document.body.classList.remove("spectator-mode");
    if (spectatorBadge) spectatorBadge.hidden = true;
    if (lobbyEl) lobbyEl.classList.remove("hidden");
    if (gameWrapEl) gameWrapEl.classList.remove("active");

    await syncLobbyFromRemote();
    const session = loadSession();
    if (session?.mode === "host" && session.gameId) {
      await fetchRemoteGame(session.gameId, 0);
    }
    const displayActive = getActiveGames(loadAllGames());
    if (watchPanel) watchPanel.hidden = displayActive.length === 0;
    updateLobbyUI();
    startLobbyPoll();

    if (noticeMessage) showLobbyNotice(noticeMessage);
    else showLobbyNotice(null);
    updateHostQrCode();
  }

  async function enterGame(gameId, mode) {
    hideResumeModal();
    await fetchRemoteGame(gameId, 0);
    const games = loadAllGames();
    const game = games[gameId];
    if (!game) {
      clearSessionIfGame(gameId);
      alert(tr("bingo.alert_game_not_found"));
      showLobby();
      return;
    }
    if (isGameAborted(game)) {
      clearSessionIfGame(gameId);
      showLobby(tr("bingo.notice_host_aborted"));
      return;
    }
    if (game.endReason === "timeout") {
      clearSessionIfGame(gameId);
      showLobby(tr("bingo.notice_timeout"));
      return;
    }
    if (game.endReason === "inactivity" && !isGameActive(game)) {
      clearSessionIfGame(gameId);
      showLobby(tr("bingo.notice_inactivity"));
      return;
    }
    if (game.endReason === "host" && !isGameActive(game)) {
      clearSessionIfGame(gameId);
      showLobby(tr("bingo.notice_host_ended"));
      return;
    }
    if (mode === "spectator" && !isGameActive(game)) {
      clearSessionIfGame(gameId);
      alert(tr("bingo.alert_game_finished"));
      showLobby();
      return;
    }
    if (isDemoGame(game)) {
      mode = "spectator";
    } else if (mode === "host" && game.hostClientId && game.hostClientId !== getClientId()) {
      alert(tr("bingo.alert_other_host"));
      mode = "spectator";
    }

    currentGameId = gameId;
    currentMode = mode;
    saveSession(gameId, mode);
    applyGameState(game);
    remoteGameUpdatedAt = gameTimestamp(game);
    resetCombo();

    document.body.classList.toggle("spectator-mode", mode === "spectator");
    if (spectatorBadge) spectatorBadge.hidden = mode !== "spectator";

    if (lobbyEl) lobbyEl.classList.add("hidden");
    if (gameWrapEl) gameWrapEl.classList.add("active");
    stopLobbyPoll();
    if (playerCardPanel) playerCardPanel.classList.remove("open");

    restoreDisplay();

    if (mode === "spectator") {
      setDrawBtnEnabled(false);
      statusEl.textContent = tr("bingo.spectator_status", { n: pool.length });
      spectatorSnapshot = "";
      spectatorLiveDrawId = null;
      spectatorAwaitingDrawResult = false;
      startSpectatorPoll();
      clearWatchParamFromUrl();
      if (isDemoGame(game)) {
        startDemoCountdownTimer();
      } else {
        stopDemoCountdownTimer();
      }
      void refreshSpectatorView();
    } else {
      stopSpectatorPoll();
      stopDemoCountdownTimer();
      startHostInactivityTimer();
      startHostGamePoll();
      void pushHostGameState({});
    }
    updateHostQrCode();
  }

  function startNewGame() {
    void (async () => {
      await syncFromRemote();
      const games = loadAllGames();
      const active = getUserActiveGames(games);
      if (active.length >= MAX_ACTIVE_GAMES) {
        alert(tr("bingo.alert_max_games", { max: MAX_ACTIVE_GAMES }));
        return;
      }
      const maxIp = remoteQuota.maxActiveGamesPerIp ?? 2;
      if ((remoteQuota.ipActiveGames ?? 0) >= maxIp) {
        alert(tr("bingo.alert_ip_game_limit", { max: maxIp }));
        return;
      }
      const game = createFreshGameState();
      games[game.id] = game;
      try {
        await saveAllGames(games);
        await enterGame(game.id, "host");
      } catch (err) {
        delete games[game.id];
        gamesCache = games;
        try {
          localStorage.setItem(GAMES_KEY, JSON.stringify(games));
        } catch (_) { /* ignore */ }
        if (err?.code === "IP_GAME_LIMIT") {
          alert(tr("bingo.alert_ip_game_limit", { max: err.max ?? maxIp }));
        }
        updateLobbyUI();
      }
    })();
  }

  async function spinAnimationFromLiveDraw(liveDraw) {
    const remain = liveDraw.endsAt - Date.now();
    const candidates = [...new Set(liveDraw.poolSnapshot || [liveDraw.num])];
    if (remain <= 120) {
      showBall(liveDraw.num);
      return;
    }
    const level = liveDraw.comboLevel || 1;
    const c = Math.max(1, Math.min(COMBO_MAX, level));
    activeDraw = {
      done: false,
      speedFactor: 1 + (c - 1) * 0.2,
      totalDuration: liveDraw.endsAt - liveDraw.startedAt,
      deadline: performance.now() + remain,
      stopSec: (liveDraw.endsAt - liveDraw.startedAt) / 1000,
      timerId: null,
      startedAt: liveDraw.startedAt,
      endsAt: liveDraw.endsAt,
      id: liveDraw.id,
    };
    await spinAnimation(liveDraw.num, candidates, level, activeDraw);
    activeDraw = null;
  }

  function showSpectatorDrawCelebration(num) {
    const meta = getMeta(num);
    if (typeof showCelebration !== "function") return;
    showCelebration({
      number: num,
      letter: meta.letter,
      color: meta.color,
      subtitle: !pool.length ? "BINGO!" : "",
      intensity: 1,
      flyToNumber: num,
    });
  }

  async function playSpectatorDrawAnimation(num, game, pendingNumbers) {
    const candidates = [...new Set([...(game.pool || []), ...pendingNumbers])];
    activeDraw = { done: false, speedFactor: 1, totalDuration: 0, deadline: 0, stopSec: 0, timerId: null };
    await spinAnimation(num, candidates, 1, activeDraw);
    activeDraw = null;

    if (!called.includes(num)) called.push(num);
    pool = pool.filter((n) => n !== num);

    renderMasterBoard();
    renderCalledList();
    updateStats();
    autoMarkPlayerCard();
    showSpectatorDrawCelebration(num);
  }

  async function refreshSpectatorView() {
    if (currentMode !== "spectator" || !currentGameId) return;

    const games = loadAllGames();
    const game = games[currentGameId];
    syncInactivityFinale(game);

    if (!game || isGameAborted(game)) {
      handleGameAborted(currentGameId);
      return;
    }
    if (game.endReason === "timeout" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_timeout"));
      return;
    }
    if (game.endReason === "inactivity" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_inactivity"));
      return;
    }
    if (game.endReason === "host" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_host_ended"));
      return;
    }
    if (!isGameActive(game)) {
      applyGameState(game);
      restoreDisplay();
      statusEl.textContent = tr("bingo.game_finished_all");
      stopSpectatorPoll();
      clearSessionIfGame(currentGameId);
      return;
    }

    const nextSnapshot = buildSpectatorSnapshot(game);
    const liveDraw = game.liveDraw;

    if (liveDraw?.id && liveDraw.num && spectatorLiveDrawId === liveDraw.id && drawing && activeDraw) {
      const remain = liveDraw.endsAt - Date.now();
      if (remain > 0) {
        activeDraw.endsAt = liveDraw.endsAt;
        activeDraw.totalDuration = liveDraw.endsAt - liveDraw.startedAt;
        activeDraw.deadline = performance.now() + remain;
      }
      return;
    }

    if (drawing && spectatorLiveDrawId && liveDraw?.id === spectatorLiveDrawId) {
      return;
    }

    if (liveDraw?.id && liveDraw.num && spectatorLiveDrawId !== liveDraw.id) {
      spectatorLiveDrawId = liveDraw.id;
      spectatorAwaitingDrawResult = true;
      drawing = true;
      statusEl.textContent = tr("bingo.spectator_drawing");
      try {
        await spinAnimationFromLiveDraw(liveDraw);
      } finally {
        drawing = false;
      }
      spectatorSnapshot = nextSnapshot;
      return;
    }

    if (!liveDraw && spectatorAwaitingDrawResult) {
      const newNumbers = (game.called || []).slice(called.length);
      if (newNumbers.length > 0) {
        applyGameState(game);
        restoreDisplay();
        showSpectatorDrawCelebration(newNumbers[newNumbers.length - 1]);
        spectatorAwaitingDrawResult = false;
        spectatorLiveDrawId = null;
        spectatorSnapshot = nextSnapshot;
        statusEl.textContent = pool.length
          ? tr("bingo.spectator_status", { n: pool.length })
          : tr("bingo.game_finished_all");
        return;
      }
    }

    if (nextSnapshot === spectatorSnapshot) return;

    const newNumbers = (game.called || []).slice(called.length);
    if (newNumbers.length > 0) {
      drawing = true;
      statusEl.textContent = tr("bingo.spectator_drawing");
      try {
        for (let i = 0; i < newNumbers.length; i += 1) {
          await playSpectatorDrawAnimation(newNumbers[i], game, newNumbers.slice(i));
        }
      } finally {
        drawing = false;
      }
      spectatorAwaitingDrawResult = false;
      spectatorLiveDrawId = null;
    }

    applyGameState(game);
    restoreDisplay();
    spectatorSnapshot = nextSnapshot;
    updateWinnerUI();
    statusEl.textContent = pool.length
      ? tr("bingo.spectator_status", { n: pool.length })
      : tr("bingo.game_finished_all");
  }

  function getSpectatorPollDelayMs() {
    const game = loadAllGames()[currentGameId];
    if (!game) return SPECTATOR_POLL_SLOW_MS;
    if (game.liveDraw || game.hasLiveDraw || spectatorAwaitingDrawResult) return SPECTATOR_POLL_FAST_MS;
    if (game.pendingWinner) return SPECTATOR_POLL_MED_MS;
    return SPECTATOR_POLL_SLOW_MS;
  }

  function startLobbyPoll() {
    stopLobbyPoll();
    lobbyPollTimer = setInterval(async () => {
      await syncLobbyFromRemote();
      updateLobbyUI();
    }, LOBBY_POLL_MS);
  }

  function stopLobbyPoll() {
    if (lobbyPollTimer) {
      clearInterval(lobbyPollTimer);
      lobbyPollTimer = null;
    }
  }

  function startSpectatorPoll() {
    stopSpectatorPoll();
    const tick = async () => {
      if (currentMode !== "spectator" || !currentGameId) return;
      await syncCurrentGameFromRemote();
      void refreshSpectatorView();
      spectatorPollTimer = setTimeout(tick, getSpectatorPollDelayMs());
    };
    spectatorPollTimer = setTimeout(tick, getSpectatorPollDelayMs());
  }

  function stopSpectatorPoll() {
    if (spectatorPollTimer) {
      clearTimeout(spectatorPollTimer);
      spectatorPollTimer = null;
    }
  }

  function startHostGamePoll() {
    stopHostGamePoll();
    const tick = async () => {
      if (currentMode !== "host" || !currentGameId) return;
      await syncCurrentGameFromRemote();
      hostGamePollTimer = setTimeout(tick, HOST_GAME_POLL_MS);
    };
    hostGamePollTimer = setTimeout(tick, HOST_GAME_POLL_MS);
  }

  function stopHostGamePoll() {
    if (hostGamePollTimer) {
      clearTimeout(hostGamePollTimer);
      hostGamePollTimer = null;
    }
  }

  function checkCurrentGameStillValid() {
    if (!currentGameId) return;
    const game = loadAllGames()[currentGameId];
    if (!game || isGameAborted(game)) {
      handleGameAborted(currentGameId);
      return;
    }
    if (game.endReason === "timeout" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_timeout"));
      return;
    }
    if (game.endReason === "inactivity" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_inactivity"));
      return;
    }
    if (game.endReason === "host" && !isGameActive(game)) {
      handleGameEnded(currentGameId, tr("bingo.notice_host_ended"));
    }
  }

  inactivityContinueBtn?.addEventListener("click", () => { void continueFromInactivity(); });

  resumeContinueBtn?.addEventListener("click", () => {
    if (!pendingResumeSession) return;
    void enterGame(pendingResumeSession.gameId, pendingResumeSession.mode);
  });

  resumeAbortBtn?.addEventListener("click", () => {
    if (!pendingResumeSession) return;
    const { gameId } = pendingResumeSession;
    const games = loadAllGames();
    const game = games[gameId];
    if (!game || !isSessionHost(pendingResumeSession, game)) return;
    if (!confirm(tr("bingo.confirm_abort"))) return;
    hideResumeModal();
    abortGame(gameId, { notifyHost: true });
  });

  resumeDismissBtn?.addEventListener("click", () => {
    if (!pendingResumeSession) return;
    const { gameId, mode } = pendingResumeSession;
    hideResumeModal();
    if (mode === "spectator") clearSessionIfGame(gameId);
    showLobby();
  });

  drawBtn?.classList.add("is-ready");
  drawBtn?.addEventListener("click", triggerDraw);
  ballEl?.addEventListener("click", () => {
    if (currentMode !== "host") return;
    triggerDraw();
  });
  resetBtn?.addEventListener("click", () => {
    if (currentMode !== "host") return;
    if (called.length && !confirm(tr("bingo.confirm_reset"))) return;
    resetCurrentGame();
  });

  digitalCardsToggle?.addEventListener("change", () => {
    if (currentMode !== "host" || !currentGameId) return;
    void pushHostGameState({ digitalCardsEnabled: !!digitalCardsToggle.checked }).then(() => {
      digitalCardsEnabled = !!digitalCardsToggle.checked;
      updateDigitalCardUI();
    });
  });

  claimCardBtn?.addEventListener("click", () => { void claimSpectatorCard(); });
  viewCardBtn?.addEventListener("click", () => {
    if (!hasMySpectatorCard()) return;
    renderPlayerCard();
    playerCardPanel?.classList.add("open");
  });
  claimBingoBtn?.addEventListener("click", () => { void claimSpectatorBingo(); });
  confirmWinnerBtn?.addEventListener("click", () => { void confirmPendingWinner(); });

  lobbyNewBtn?.addEventListener("click", startNewGame);
  demoNewGameBtn?.addEventListener("click", () => { void startNewGame(); });
  lobbyWatchBtn?.addEventListener("click", async () => {
    await syncFromRemote();
    if (watchPanel) watchPanel.hidden = false;
    updateLobbyUI();
  });
  backLobbyBtn?.addEventListener("click", () => {
    if (currentMode === "host" && drawing) {
      if (!confirm(tr("bingo.confirm_leave_drawing"))) return;
    }
    void (async () => {
      if (currentMode === "host" && currentGameId) {
        await pushHostGameState({ liveDraw: null });
      }
      await showLobby();
    })();
  });

  document.addEventListener("keydown", (e) => {
    if (currentMode !== "host") return;
    if (e.code !== "Space" && e.key !== " ") return;
    if (e.target.matches("input, textarea, select")) return;
    e.preventDefault();
    triggerDraw();
  });

  window.addEventListener("storage", (e) => {
    if (e.key !== GAMES_KEY) return;
    gamesCache = readGamesFromStorage();
    refreshUIAfterSync();
  });

  BROADCAST?.addEventListener("message", (e) => {
    if (e.data?.type !== "sync") return;
    if (currentGameId) void syncCurrentGameFromRemote();
    else void syncLobbyFromRemote();
  });

  async function bootstrap() {
    ensureGamesCache();
    await syncFromRemote();

    const watchGameId = new URLSearchParams(window.location.search).get("watch");
    if (watchGameId) {
      await enterGame(String(watchGameId), "spectator");
      return;
    }

    const session = loadSession();
    if (!session?.gameId) {
      await showLobby();
      return;
    }

    const games = loadAllGames();
    const game = games[session.gameId];
    if (!game || !isGameActive(game)) {
      clearSessionIfGame(session.gameId);
      await showLobby();
      return;
    }

    if (isPageReload()) {
      void enterGame(session.gameId, session.mode);
      return;
    }

    showResumeModal(game, session);
  }

  bindHostQrInteractions();
  window.addEventListener("resize", () => {
    if (!hostQrPanel || hostQrPanel.hidden) return;
    hostQrGameId = null;
    updateHostQrCode();
  });

  function refreshBingoUi() {
    if (window.YFC_I18N) YFC_I18N.apply();
    updateLobbyUI();
    if (currentGameId && currentMode) {
      restoreDisplay();
      if (currentMode === "spectator") {
        statusEl.textContent = pool.length
          ? tr("bingo.spectator_status", { n: pool.length })
          : tr("bingo.game_finished_all");
        updateDemoSpectatorUI();
      } else if (currentMode === "host") {
        updateInactivityModal(loadAllGames()[currentGameId]);
        updateDigitalCardUI();
        updateWinnerUI();
      }
    }
    if (pendingResumeSession) {
      const game = loadAllGames()[pendingResumeSession.gameId];
      if (game) showResumeModal(game, pendingResumeSession);
    }
  }

  document.addEventListener("portal-lang-change", refreshBingoUi);

  void bootstrap();
})();
