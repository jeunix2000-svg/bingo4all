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
  const HOST_QR_SIZE = 216;
  const HOST_QR_LONG_PRESS_MS = 600;
  const CFG = window.BINGO4ALL_CONFIG || {};
  const SYNC_URL = CFG.bingoSyncUrl || CFG.apiUrl || "scripts/bingo-games.php";
  const SYNC_POLL_MS = 1000;
  const SPECTATOR_POLL_MS = 150;
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
  const masterBoardEl = document.getElementById("master-board");
  const calledListEl = document.getElementById("called-list");
  const playerCardEl = document.getElementById("player-card");
  const playerCardPanel = document.getElementById("player-card-panel");
  const digitalCardsToggle = document.getElementById("digital-cards-toggle");
  const physicalCardNote = document.getElementById("physical-card-note");
  const claimCardBtn = document.getElementById("claim-card-btn");
  const viewCardBtn = document.getElementById("view-card-btn");
  const claimBingoBtn = document.getElementById("claim-bingo-btn");
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
    const pageName = (window.location.pathname.split("/").pop() || "index.html");
    const base = appBase
      ? `${String(appBase).replace(/\/$/, "")}/${pageName === "" ? "index.html" : pageName}`
      : `${window.location.origin}${window.location.pathname}`;
    const url = new URL(base);
    url.searchParams.set("watch", String(gameId));
    return url.toString();
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

  function getHostQrImageElement() {
    if (!hostQrCodeEl) return null;
    return hostQrCodeEl.querySelector("canvas") || hostQrCodeEl.querySelector("img");
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
    const imageEl = getHostQrImageElement();
    if (!imageEl || !currentGameId) {
      showHostQrSaveToast(tr("bingo.qr_save_fail"));
      return false;
    }
    try {
      const dataUrl = imageEl.tagName === "CANVAS"
        ? imageEl.toDataURL("image/png")
        : imageEl.src;
      const link = document.createElement("a");
      link.download = `bingo-watch-${currentGameId}.png`;
      link.href = dataUrl;
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
    if (hostQrGameId === currentGameId && hostQrCodeEl.childNodes.length) return;
    if (typeof QRCode === "undefined") {
      hostQrPanel.hidden = true;
      return;
    }
    hostQrGameId = currentGameId;
    hostQrCodeEl.innerHTML = "";
    try {
      new QRCode(hostQrCodeEl, {
        text: buildSpectatorJoinUrl(currentGameId),
        width: HOST_QR_SIZE,
        height: HOST_QR_SIZE,
        colorDark: "#1a1a2e",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
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
    return (Array.isArray(game.pool) && game.pool.length > 0) || !!game.liveDraw;
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

  async function fetchRemoteGames() {
    if (!remoteSyncEnabled) return null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await fetch(`${SYNC_URL}?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (res.status === 404) remoteSyncEnabled = false;
          return null;
        }
        const data = await res.json();
        applyRemoteQuota(data);
        return data?.games && typeof data.games === "object" ? data.games : null;
      } catch (_) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }
    return null;
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
        applyRemoteQuota(data);
        if (data.games) mergeServerGames(data.games);
        return { ok: false, error: "IP_GAME_LIMIT", max: data.maxActiveGamesPerIp ?? remoteQuota.maxActiveGamesPerIp };
      }
      if (!res.ok) {
        if (res.status === 404) remoteSyncEnabled = false;
        return { ok: false };
      }
      applyRemoteQuota(data);
      if (data?.games) mergeServerGames(data.games);
      return { ok: true };
    } catch (_) {
      return { ok: false };
    }
  }

  async function syncFromRemote() {
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      const remote = await fetchRemoteGames();
      if (!remote) return false;
      const local = ensureGamesCache();
      const merged = mergeGameMaps(local, remote);
      applyGameTimeouts(merged);
      if (!gamesChanged(merged, gamesCache)) return false;
      gamesCache = merged;
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
    if (poolUnique.length + normalizedCalled.length < 75) {
      const missing = [];
      for (let i = 1; i <= 75; i++) {
        if (!calledSet.has(i) && !poolUnique.includes(i)) missing.push(i);
      }
      poolUnique.push(...missing);
    }
    game.called = normalizedCalled;
    game.pool = poolUnique;
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

  async function claimSpectatorCard() {
    if (currentMode !== "spectator" || !digitalCardsEnabled || hasMySpectatorCard()) return;
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
    await syncFromRemote();
    const game = loadAllGames()[currentGameId];
    if (game) applyGameState(game);
    renderPlayerCard();
    playerCardPanel?.classList.add("open");
    updateDigitalCardUI();
  }

  async function claimSpectatorBingo() {
    if (currentMode !== "spectator" || !digitalCardsEnabled || !hasMySpectatorCard()) return;
    if (!checkCardBingo(playerCard, called)) return;
    const result = await postSpectatorAction("claimBingo", { hasBingo: true });
    if (!result.ok) {
      alert(tr("bingo.alert_claim_bingo_fail"));
      return;
    }
    await syncFromRemote();
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
    const game = currentGameId ? loadAllGames()[currentGameId] : null;
    const spectator = currentMode === "spectator" && game && !isDemoGame(game);
    const enabled = spectator && digitalCardsEnabled;

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
  }

  function updateWinnerUI() {
    const hasPending = !!pendingWinner;
    const isSelf = hasPending && pendingWinner.clientId === getClientId();

    if (winnerBanner) winnerBanner.classList.toggle("visible", hasPending);
    if (winnerBannerText) {
      winnerBannerText.classList.toggle("is-self", isSelf);
      if (!hasPending) {
        winnerBannerText.textContent = "";
      } else if (currentMode === "host") {
        winnerBannerText.textContent = tr("bingo.winner_host_msg", { name: pendingWinner.deviceLabel });
      } else if (isSelf) {
        winnerBannerText.textContent = tr("bingo.winner_self_msg");
        showWinnerCelebrationOnce(pendingWinner);
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
    return `${game?.called?.length ?? 0}:${game?.called?.[game.called.length - 1] ?? ""}:${game?.pool?.length ?? 0}:${liveDrawId}:${pendingId}:${cardsOn}:${myCard}`;
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
    } else {
      delete gameState.spectatorCards;
    }
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
    if (currentMode === "spectator") {
      const mine = spectatorCards[getClientId()];
      if (mine?.playerCard?.length) {
        playerCard = mine.playerCard;
        playerMarked = mine.playerMarked?.length ? mine.playerMarked : buildPlayerCard().playerMarked;
      } else {
        playerCard = [];
        playerMarked = [];
      }
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
    if (currentMode === "spectator" && hasMySpectatorCard()) {
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

  function updateStats() {
    remainEl.textContent = pool.length;
    calledCountEl.textContent = called.length;
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
      gameBarMeta.textContent = tr("bingo.game_bar_meta", { called: called.length, pool: pool.length });
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
    const num = pool.pop();
    if (called.includes(num)) {
      pool = pool.filter((n) => n !== num && !called.includes(n));
      return drawFromPool();
    }
    return num;
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
    const called = game.called.length;
    const poolLeft = game.pool.length;
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
      const isOwner = !demo && game.hostClientId === getClientId();
      const meta = demo
        ? tr("bingo.game_meta_demo", { host: escapeHtml(game.hostLabel || "Portal Server"), called: game.called.length, pool: game.pool.length })
        : formatGameListMeta(game);
      li.innerHTML = `
        <div>
          <div class="game-name">${escapeHtml(displayGameName(game))}${demo ? ` <span class="demo-badge">${escapeHtml(tr("bingo.demo_badge"))}</span>` : ""}</div>
          <div class="game-meta">${meta}</div>
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
    if (!game || isDemoGame(game) || game.hostClientId !== getClientId()) return false;
    if (isGameAborted(game) || (!isGameActive(game) && game.status === "finished")) return false;

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

    await syncFromRemote();
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
    await syncFromRemote();
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

  function startLobbyPoll() {
    stopLobbyPoll();
    lobbyPollTimer = setInterval(async () => {
      await syncFromRemote();
      updateLobbyUI();
    }, SYNC_POLL_MS);
  }

  function stopLobbyPoll() {
    if (lobbyPollTimer) {
      clearInterval(lobbyPollTimer);
      lobbyPollTimer = null;
    }
  }

  function startSpectatorPoll() {
    stopSpectatorPoll();
    spectatorPollTimer = setInterval(async () => {
      await syncFromRemote();
      void refreshSpectatorView();
    }, SPECTATOR_POLL_MS);
  }

  function stopSpectatorPoll() {
    if (spectatorPollTimer) {
      clearInterval(spectatorPollTimer);
      spectatorPollTimer = null;
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
    persistCurrentGame();
    showLobby();
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
    syncFromRemote();
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
