/**
 * Bingo 游戏状态共享 API（Render Web Service）
 * GET  /              → 全部游戏
 * POST /              → 合并上传（按 updatedAt 取新）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { DEMO_GAME_ID, isDemoGame, tickDemoGame, ensureDemoGame } = require('./demoGame');

const MAX_GAME_MS = 5 * 60 * 60 * 1000;
const PRUNE_AGE_MS = 24 * 60 * 60 * 1000;
const HOST_INACTIVITY_IDLE_MS = 3 * 60 * 1000;
const HOST_INACTIVITY_GRACE_MS = 60 * 1000;
const DATA_DIR = process.env.BINGO_DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bingo-games.json');
const PORTAL_ORIGIN = (process.env.APP_ORIGIN || process.env.PORTAL_ORIGIN || '*').trim();
const DEMO_TICK_MS = Number(process.env.DEMO_TICK_MS || 1000);

const app = express();
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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
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

function mergeGames(base, incoming) {
  const preservedDemo = base[DEMO_GAME_ID];
  const out = { ...base };
  for (const [id, game] of Object.entries(incoming || {})) {
    if (!game || typeof game !== 'object') continue;
    const gid = String(game.id || id);
    if (gid === DEMO_GAME_ID || isDemoGame(game)) continue;
    if (!out[gid] || gameTimestamp(game) >= gameTimestamp(out[gid])) {
      out[gid] = game;
    }
  }
  if (preservedDemo) out[DEMO_GAME_ID] = preservedDemo;
  return out;
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

function respondGames(res, games) {
  res.set('Cache-Control', 'no-store');
  res.json({
    games,
    serverTime: Date.now(),
  });
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bingo4all-api' });
});

app.get(['/', '/api/games'], (_req, res) => {
  const games = prepareGames(loadGames());
  saveGames(games);
  respondGames(res, games);
});

app.post(['/', '/api/games'], (req, res) => {
  const incoming = req.body?.games;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' });
  }
  let merged = mergeGames(loadGames(), incoming);
  merged = prepareGames(merged);
  try {
    saveGames(merged);
  } catch {
    return res.status(500).json({ error: 'SAVE_FAILED' });
  }
  respondGames(res, merged);
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
