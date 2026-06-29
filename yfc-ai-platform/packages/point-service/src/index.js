// packages/point-service/src/index.js  — サービス起動エントリ
import express from 'express';
import pg from 'pg';
import { AwardPointsUseCase } from './application/awardPoints.js';
import { LedgerRepository } from './infrastructure/pgLedgerRepository.js';
import { pointsRouter } from './interfaces/http/pointsController.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const awardPoints = new AwardPointsUseCase(new LedgerRepository(pool));

const app = express();
app.use((req, res, next) => {
  const origin = req.header('Origin');
  const configured = process.env.PORTAL_ORIGIN?.trim();
  if (configured === '*' || (!configured && origin)) {
    res.header('Access-Control-Allow-Origin', configured === '*' ? '*' : origin);
    res.header('Vary', 'Origin');
  } else if (configured && origin === configured) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-user-role, x-request-id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'point-service' }));
app.use('/api/v1/points', pointsRouter(awardPoints));

const port = process.env.PORT ?? 8081;
app.listen(port, () => console.log(`[point-service] listening on :${port}`));
