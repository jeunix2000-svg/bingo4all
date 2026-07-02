# AGENTS.md

## Cursor Cloud specific instructions

Bingo4All is a party Bingo hosting/spectating web app with two services (both defined in `render.yaml`):

- **Frontend** — static vanilla HTML/JS at the repo root (`index.html`, `bingo.js`, etc.). No build step, no `package.json`, no dependencies. Serve it with `npx -y serve . -l 3000` from the repo root.
- **API** — Node.js/Express game-state sync service in `api/` (`server.js`). Requires Node >= 20. Install with `npm install` (run in `api/`), start with `npm start` (listens on port `8080`; health check `GET /health`).

Standard local-dev commands live in `README.md` ("本地开发" section). Run the API with `APP_ORIGIN=http://localhost:3000 npm start` so CORS allows the local frontend origin.

Non-obvious caveats:

- **Local dev requires editing `bingo-config.js`.** It defaults `bingoSyncUrl`/`appBaseUrl` to the production Render URLs. For local testing, temporarily set `bingoSyncUrl: 'http://localhost:8080'` and `appBaseUrl: 'http://localhost:3000'`, but do NOT commit this — the committed values must stay pointed at the production Render URLs or deployment breaks.
- **No lint, test, or build tooling exists** anywhere in this repo. The API's only npm script is `start`; the frontend is static with no manifest. There is no Makefile, no CI, and no test files. Do not assume `npm test`/`npm run lint`/`npm run build` exist.
- The API persists game state to `api/data/bingo-games.json` (file-based storage). A built-in 24/7 demo game (`server-demo-bingo`) always appears in `/api/games` and ticks every `DEMO_TICK_MS` (default 1000ms).
- Optional API env vars: `PORT`, `APP_ORIGIN`/`PORTAL_ORIGIN` (CORS allow-list), `MAX_GAMES_PER_IP` (default 2), `BINGO_DATA_DIR`, `DEMO_TICK_MS`, `NODE_ENV`.
