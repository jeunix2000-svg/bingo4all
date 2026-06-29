/**
 * サーバー常時稼働のデモ観戦ゲーム（ユーザー作成の 10 件上限に含めない）
 */
const DEMO_GAME_ID = 'server-demo-bingo';
const DEMO_HOST_ID = 'server-demo-host';
const DEMO_SPIN_MS = Number(process.env.DEMO_SPIN_MS || 5000);
const DEMO_PAUSE_MS = Number(process.env.DEMO_PAUSE_MS || 25000);

const RANGES = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPlayerCard() {
  const playerCard = RANGES.map((range) => {
    const nums = [];
    for (let n = range.min; n <= range.max; n += 1) nums.push(n);
    return shuffle(nums).slice(0, 5);
  });
  playerCard[2][2] = null;
  const playerMarked = playerCard.map((col) => col.map(() => false));
  playerMarked[2][2] = true;
  return { playerCard, playerMarked };
}

function createDemoGame() {
  const now = Date.now();
  const { playerCard, playerMarked } = buildPlayerCard();
  return {
    id: DEMO_GAME_ID,
    name: 'デモ観戦（サーバー常時稼働）',
    isDemo: true,
    demoOnly: true,
    status: 'active',
    hostClientId: DEMO_HOST_ID,
    hostLabel: 'Portal Server',
    createdAt: now,
    updatedAt: now,
    round: 1,
    pool: shuffle(Array.from({ length: 75 }, (_, i) => i + 1)),
    called: [],
    liveDraw: null,
    demoNextDrawAt: now + 1500,
    playerCard,
    playerMarked,
  };
}

function isDemoGame(game) {
  return !!(game?.isDemo || game?.id === DEMO_GAME_ID);
}

function resetDemoRound(game) {
  const { playerCard, playerMarked } = buildPlayerCard();
  game.pool = shuffle(Array.from({ length: 75 }, (_, i) => i + 1));
  game.called = [];
  game.liveDraw = null;
  game.round = (game.round || 1) + 1;
  game.demoNextDrawAt = Date.now() + DEMO_PAUSE_MS;
  game.playerCard = playerCard;
  game.playerMarked = playerMarked;
  game.status = 'active';
  game.updatedAt = Date.now();
}

function advanceDemoGame(game, now = Date.now()) {
  if (!game || !isDemoGame(game)) return false;

  if (game.liveDraw) {
    if (now < game.liveDraw.endsAt) return false;
    const num = Number(game.liveDraw.num);
    if (num >= 1 && num <= 75 && !game.called.includes(num)) {
      game.called.push(num);
    }
    game.liveDraw = null;
    game.demoNextDrawAt = now + DEMO_PAUSE_MS;
    game.updatedAt = now;
    if (!game.pool.length) resetDemoRound(game);
    return true;
  }

  if (!game.pool.length) {
    resetDemoRound(game);
    return true;
  }

  if (now < Number(game.demoNextDrawAt || 0)) return false;

  const num = game.pool.pop();
  if (num == null) {
    resetDemoRound(game);
    return true;
  }

  const startedAt = now;
  game.liveDraw = {
    id: `${DEMO_GAME_ID}-${startedAt}`,
    num,
    startedAt,
    endsAt: startedAt + DEMO_SPIN_MS,
    comboLevel: 1,
    poolSnapshot: [...game.pool, num],
  };
  game.updatedAt = now;
  return true;
}

function ensureDemoGame(games) {
  if (!games[DEMO_GAME_ID] || !isDemoGame(games[DEMO_GAME_ID])) {
    games[DEMO_GAME_ID] = createDemoGame();
    return true;
  }
  const game = games[DEMO_GAME_ID];
  if (game.status !== 'active') {
    games[DEMO_GAME_ID] = createDemoGame();
    return true;
  }
  return false;
}

function tickDemoGame(games) {
  ensureDemoGame(games);
  return advanceDemoGame(games[DEMO_GAME_ID]);
}

module.exports = {
  DEMO_GAME_ID,
  DEMO_HOST_ID,
  isDemoGame,
  ensureDemoGame,
  tickDemoGame,
  createDemoGame,
};
