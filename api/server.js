/**
 * Bingo 游戏状态共享 API（Render Web Service）
 * GET  /                    → 全部游戏（支持 ETag / revision 304）
 * GET  /api/games/summary   → 大厅摘要列表
 * GET  /api/games/:gameId   → 单场游戏（?since=updatedAt 无变化时 changed:false）
 * POST /                    → 合并上传（按 updatedAt 取新）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { DEMO_GAME_ID, isDemoGame, tickDemoGame, ensureDemoGame } = require('./demoGame');

const MAX_GAME_MS = 5 * 60 * 60 * 1000;
const PRUNE_AGE_MS = 24 * 60 * 60 * 1000;
const HOST_INACTIVITY_IDLE_MS = 3 * 60 * 1000;
const HOST_INACTIVITY_GRACE_MS = 60 * 1000;
const MAX_GAMES_PER_IP = Number(process.env.MAX_GAMES_PER_IP || 2);
const DATA_DIR = process.env.BINGO_DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bingo-games.json');
const PORTAL_ORIGIN = (process.env.APP_ORIGIN || process.env.PORTAL_ORIGIN || '*').trim();
const DEMO_TICK_MS = Number(process.env.DEMO_TICK_MS || 1000);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (PORTAL_ORIGIN === '*') {
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
  } else if (origin && (PORTAL_ORIGIN === origin || PORTAL_ORIGIN.split(',').map((s) => s.trim()).includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (!PORTAL_ORIGIN && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, If-None-Match');
  res.header('Access-Control-Expose-Headers', 'ETag');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');
}

function loadGames() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw || '{}');
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

function saveGames(games) {
  ensureDataFile();
  const json = JSON.stringify(games, null, 2);
  const tmp = `${DATA_FILE}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function gameTimestamp(game) {
  return Number(game?.updatedAt || game?.createdAt || 0);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

function countActiveGamesForIp(games, ip) {
  if (!ip || ip === 'unknown') return 0;
  return Object.values(games).filter(
    (game) => !isDemoGame(game) && isUserGameActive(game) && game.hostIp === ip,
  ).length;
}

function mergeSpectatorCards(existing, incoming) {
  const prev = existing && typeof existing === 'object' ? existing : {};
  if (!incoming || typeof incoming !== 'object') return prev;
  return { ...prev, ...incoming };
}

function mergeGames(base, incoming, clientIp, posterClientId) {
  const preservedDemo = base[DEMO_GAME_ID];
  const out = { ...base };
  const rejectedNewIds = [];
  let activeForIp = countActiveGamesForIp(base, clientIp);

  for (const [id, game] of Object.entries(incoming || {})) {
    if (!game || typeof game !== 'object') continue;
    const gid = String(game.id || id);
    if (gid === DEMO_GAME_ID || isDemoGame(game)) continue;

    const existing = out[gid];
    const isNew = !existing;

    if (isNew) {
      if (activeForIp >= MAX_GAMES_PER_IP) {
        rejectedNewIds.push(gid);
        continue;
      }
      const stored = {
        ...game,
        hostIp: clientIp,
        hostClientId: game.hostClientId || posterClientId || undefined,
      };
      out[gid] = stored;
      if (isUserGameActive(stored)) activeForIp += 1;
      continue;
    }

    if (gameTimestamp(game) >= gameTimestamp(existing)) {
      out[gid] = {
        ...game,
        hostIp: existing.hostIp || game.hostIp,
        hostClientId: game.hostClientId || existing.hostClientId,
        hostLabel: game.hostLabel || existing.hostLabel,
        digitalCardsEnabled: 'digitalCardsEnabled' in game
          ? !!game.digitalCardsEnabled
          : !!existing.digitalCardsEnabled,
        spectatorCards: mergeSpectatorCards(existing.spectatorCards, game.spectatorCards),
        pendingWinner: 'pendingWinner' in game ? game.pendingWinner : (existing.pendingWinner ?? null),
        confirmedWinners: game.confirmedWinners ?? existing.confirmedWinners ?? [],
      };
    }
  }

  if (preservedDemo) out[DEMO_GAME_ID] = preservedDemo;
  return { games: out, rejectedNewIds };
}

function isUserGameActive(game) {
  if (!game || typeof game !== 'object') return false;
  if (game.status === 'aborted') return false;
  if (isDemoGame(game)) return game.status === 'active';
  return (Array.isArray(game.pool) && game.pool.length > 0) || !!game.liveDraw;
}

function applyInactivityTimeouts(games) {
  const now = Date.now();
  for (const game of Object.values(games)) {
    if (!game || typeof game !== 'object') continue;
    if (isDemoGame(game) || game.status === 'aborted') continue;
    if (!isUserGameActive(game)) continue;

    const lastActive = Number(game.hostLastActiveAt || game.updatedAt || game.createdAt || 0);

    if (game.inactivityEndsAt) {
      if (now >= Number(game.inactivityEndsAt)) {
        game.status = 'finished';
        game.endReason = 'inactivity';
        game.endedAt = now;
        game.updatedAt = now;
        game.pool = [];
        game.liveDraw = null;
        game.inactivityEndsAt = null;
      }
      continue;
    }

    if (lastActive && now - lastActive >= HOST_INACTIVITY_IDLE_MS) {
      game.inactivityEndsAt = now + HOST_INACTIVITY_GRACE_MS;
      game.updatedAt = now;
    }
  }
  return games;
}

function applyTimeouts(games) {
  const now = Date.now();
  for (const [id, game] of Object.entries(games)) {
    if (!game || typeof game !== 'object') continue;
    if (isDemoGame(game)) continue;
    if (game.status === 'aborted') continue;
    const created = Number(game.createdAt || 0);
    if (!created || now - created < MAX_GAME_MS) continue;
    if (game.status === 'finished' && !(game.pool || []).length) continue;
    game.status = 'finished';
    game.endReason = 'timeout';
    game.endedAt = now;
    game.updatedAt = now;
    game.pool = [];
  }
  return games;
}

function pruneOldGames(games) {
  const now = Date.now();
  for (const [id, game] of Object.entries(games)) {
    if (!game || typeof game !== 'object') {
      delete games[id];
      continue;
    }
    if (isDemoGame(game)) continue;
    const status = game.status || 'active';
    const ts = gameTimestamp(game);
    const poolEmpty = !(game.pool || []).length;
    if (status === 'aborted' || (status === 'finished' && poolEmpty)) {
      if (now - ts > PRUNE_AGE_MS) delete games[id];
    }
  }
  return games;
}

function prepareGames(games) {
  ensureDemoGame(games);
  tickDemoGame(games);
  applyInactivityTimeouts(games);
  applyTimeouts(games);
  pruneOldGames(games);
  return games;
}

function getRevision(games) {
  let revision = 0;
  for (const game of Object.values(games || {})) {
    revision = Math.max(revision, gameTimestamp(game));
  }
  return revision;
}

function prepareGamesMaybePersist(games) {
  const before = JSON.stringify(games);
  prepareGames(games);
  if (before !== JSON.stringify(games)) {
    saveGames(games);
    return true;
  }
  return false;
}

function sendNotModifiedIfMatch(req, res, revision) {
  const clientRevision = req.header('If-None-Match') || req.query.revision;
  if (clientRevision != null && clientRevision !== '' && String(revision) === String(clientRevision)) {
    res.set('ETag', String(revision));
    res.status(304).end();
    return true;
  }
  return false;
}

function countGameParticipants(game) {
  if (!game?.digitalCardsEnabled) return 0;
  return Object.values(game.spectatorCards || {}).filter((entry) => entry?.playerCard?.length).length;
}

function buildGameSummary(game) {
  return {
    id: game.id,
    name: game.name,
    isDemo: isDemoGame(game),
    demoOnly: !!game.demoOnly,
    status: game.status || 'active',
    hostClientId: game.hostClientId,
    hostLabel: game.hostLabel,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    hostLastActiveAt: game.hostLastActiveAt,
    inactivityEndsAt: game.inactivityEndsAt,
    calledCount: (game.called || []).length,
    poolCount: (game.pool || []).length,
    participantCount: countGameParticipants(game),
    digitalCardsEnabled: !!game.digitalCardsEnabled,
    hasLiveDraw: !!game.liveDraw,
  };
}

function getActiveSummaries(games) {
  return Object.values(games)
    .filter(isUserGameActive)
    .sort((a, b) => {
      if (isDemoGame(a) && !isDemoGame(b)) return -1;
      if (!isDemoGame(a) && isDemoGame(b)) return 1;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    })
    .map(buildGameSummary);
}

const BINGO_RANGES = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];

function isCellMarkedForBingo(col, row, card, calledSet) {
  if (col === 2 && row === 2) return true;
  const num = card[col][row];
  return num !== null && num !== undefined && calledSet.has(Number(num));
}

function checkCardBingo(card, called) {
  if (!Array.isArray(card) || card.length !== 5) return false;
  const calledSet = new Set((called || []).map(Number));
  for (let row = 0; row < 5; row += 1) {
    let complete = true;
    for (let col = 0; col < 5; col += 1) {
      if (!isCellMarkedForBingo(col, row, card, calledSet)) complete = false;
    }
    if (complete) return true;
  }
  for (let col = 0; col < 5; col += 1) {
    let complete = true;
    for (let row = 0; row < 5; row += 1) {
      if (!isCellMarkedForBingo(col, row, card, calledSet)) complete = false;
    }
    if (complete) return true;
  }
  let complete = true;
  for (let i = 0; i < 5; i += 1) {
    if (!isCellMarkedForBingo(i, i, card, calledSet)) complete = false;
  }
  if (complete) return true;
  complete = true;
  for (let i = 0; i < 5; i += 1) {
    if (!isCellMarkedForBingo(i, 4 - i, card, calledSet)) complete = false;
  }
  return complete;
}

function validateSpectatorCard(card, marked) {
  if (!Array.isArray(card) || card.length !== 5) return false;
  if (!Array.isArray(marked) || marked.length !== 5) return false;
  for (let col = 0; col < 5; col += 1) {
    if (!Array.isArray(card[col]) || card[col].length !== 5) return false;
    if (!Array.isArray(marked[col]) || marked[col].length !== 5) return false;
    for (let row = 0; row < 5; row += 1) {
      if (col === 2 && row === 2) {
        if (card[col][row] !== null) return false;
        continue;
      }
      const num = Number(card[col][row]);
      const range = BINGO_RANGES[col];
      if (!Number.isFinite(num) || num < range.min || num > range.max) return false;
    }
  }
  return true;
}

function respondGames(res, games, req, extra = {}) {
  const clientIp = getClientIp(req);
  const revision = getRevision(games);
  res.set('Cache-Control', 'no-store');
  res.set('ETag', String(revision));
  res.json({
    games,
    revision,
    serverTime: Date.now(),
    ipActiveGames: countActiveGamesForIp(games, clientIp),
    maxActiveGamesPerIp: MAX_GAMES_PER_IP,
    ...extra,
  });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bingo4all-api' });
});

app.get('/api/games/summary', (req, res) => {
  const games = loadGames();
  prepareGamesMaybePersist(games);
  const revision = getRevision(games);
  if (sendNotModifiedIfMatch(req, res, revision)) return;
  const clientIp = getClientIp(req);
  res.set('Cache-Control', 'no-store');
  res.set('ETag', String(revision));
  res.json({
    revision,
    serverTime: Date.now(),
    summaries: getActiveSummaries(games),
    ipActiveGames: countActiveGamesForIp(games, clientIp),
    maxActiveGamesPerIp: MAX_GAMES_PER_IP,
  });
});

app.get('/api/games/:gameId', (req, res) => {
  const games = loadGames();
  prepareGamesMaybePersist(games);
  const revision = getRevision(games);
  const gameId = String(req.params.gameId || '');
  const game = games[gameId];
  if (!game || typeof game !== 'object') {
    return res.status(404).json({ error: 'GAME_NOT_FOUND', revision, serverTime: Date.now() });
  }

  const since = Number(req.query.since || 0);
  const clientRevision = req.header('If-None-Match') || req.query.revision;
  const gameUpdatedAt = gameTimestamp(game);
  const unchanged = since > 0 && gameUpdatedAt <= since;

  if (unchanged && clientRevision != null && clientRevision !== '' && String(revision) === String(clientRevision)) {
    res.set('ETag', String(revision));
    return res.status(304).end();
  }

  if (unchanged) {
    res.set('Cache-Control', 'no-store');
    res.set('ETag', String(revision));
    return res.json({
      changed: false,
      gameId,
      updatedAt: gameUpdatedAt,
      revision,
      serverTime: Date.now(),
    });
  }

  const clientIp = getClientIp(req);
  res.set('Cache-Control', 'no-store');
  res.set('ETag', String(revision));
  res.json({
    changed: true,
    gameId,
    game,
    updatedAt: gameUpdatedAt,
    revision,
    serverTime: Date.now(),
    ipActiveGames: countActiveGamesForIp(games, clientIp),
    maxActiveGamesPerIp: MAX_GAMES_PER_IP,
  });
});

app.get(['/', '/api/games'], (req, res) => {
  const games = loadGames();
  prepareGamesMaybePersist(games);
  const revision = getRevision(games);
  if (sendNotModifiedIfMatch(req, res, revision)) return;
  respondGames(res, games, req);
});

app.post(['/', '/api/games'], (req, res) => {
  const incoming = req.body?.games;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }
  const clientIp = getClientIp(req);
  const posterClientId = req.body?.clientId ? String(req.body.clientId) : '';
  const base = loadGames();
  prepareGames(base);
  const { games: merged, rejectedNewIds } = mergeGames(base, incoming, clientIp, posterClientId);
  const prepared = prepareGames(merged);

  if (rejectedNewIds.length > 0) {
    return res.status(429).json({
      error: 'IP_GAME_LIMIT',
      message: `Maximum ${MAX_GAMES_PER_IP} active games per IP`,
      maxActiveGamesPerIp: MAX_GAMES_PER_IP,
      ipActiveGames: countActiveGamesForIp(prepared, clientIp),
      rejectedGameIds: rejectedNewIds,
      games: prepared,
      revision: getRevision(prepared),
      serverTime: Date.now(),
    });
  }

  try {
    saveGames(prepared);
  } catch {
    return res.status(500).json({ error: 'SAVE_FAILED' });
  }
  respondGames(res, prepared, req);
});

app.post(['/api/spectator', '/spectator'], (req, res) => {
  const { gameId, clientId, action, data } = req.body || {};
  if (!gameId || !clientId || !action) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }

  const games = loadGames();
  prepareGames(games);
  const gid = String(gameId);
  const game = games[gid];
  if (!game || typeof game !== 'object' || isDemoGame(game) || game.status === 'aborted') {
    return res.status(404).json({ error: 'GAME_NOT_FOUND' });
  }
  if (!isUserGameActive(game)) {
    return res.status(409).json({ error: 'GAME_NOT_ACTIVE' });
  }

  const now = Date.now();
  const cid = String(clientId);
  game.spectatorCards = game.spectatorCards || {};
  game.confirmedWinners = game.confirmedWinners || [];

  if (action === 'claimCard') {
    if (!game.digitalCardsEnabled) {
      return res.status(403).json({ error: 'DIGITAL_CARDS_DISABLED' });
    }
    if (game.spectatorCards[cid]) {
      return respondGames(res, games, req);
    }
    const card = data?.playerCard;
    const marked = data?.playerMarked;
    if (!validateSpectatorCard(card, marked)) {
      return res.status(400).json({ error: 'INVALID_CARD' });
    }
    game.spectatorCards[cid] = {
      clientId: cid,
      deviceLabel: String(data?.deviceLabel || cid).slice(0, 80),
      playerCard: card,
      playerMarked: marked,
      claimedAt: now,
    };
    game.updatedAt = now;
  } else if (action === 'claimBingo') {
    if (!game.digitalCardsEnabled) {
      return res.status(403).json({ error: 'DIGITAL_CARDS_DISABLED' });
    }
    if (game.pendingWinner) {
      return res.status(409).json({ error: 'PENDING_WINNER_EXISTS' });
    }
    const entry = game.spectatorCards[cid];
    if (!entry) {
      return res.status(404).json({ error: 'NO_CARD' });
    }
    if ((game.confirmedWinners || []).some((w) => w.clientId === cid)) {
      return res.status(409).json({ error: 'ALREADY_WON' });
    }
    if (!checkCardBingo(entry.playerCard, game.called || [])) {
      return res.status(400).json({ error: 'NOT_BINGO' });
    }
    game.pendingWinner = {
      clientId: cid,
      deviceLabel: entry.deviceLabel || cid,
      claimedAt: now,
    };
    game.updatedAt = now;
  } else {
    return res.status(400).json({ error: 'UNKNOWN_ACTION' });
  }

  try {
    saveGames(games);
  } catch {
    return res.status(500).json({ error: 'SAVE_FAILED' });
  }
  respondGames(res, games, req);
});

setInterval(() => {
  try {
    const games = loadGames();
    if (tickDemoGame(games)) saveGames(games);
  } catch (err) {
    console.error('[bingo4all-api] demo tick failed', err);
  }
}, DEMO_TICK_MS);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`[bingo4all-api] listening on :${port}`);
});
