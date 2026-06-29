// packages/point-service/src/interfaces/http/pointsController.js
// Express ルータ。OpenAPI / Webhook からの採点イベントを受ける。
import { Router } from 'express';

export function pointsRouter(awardPoints) {
  const router = Router();

  // Wiki からの Webhook（記事公開・採択・いいね 等）
  router.post('/events', async (req, res) => {
    try {
      const out = await awardPoints.execute(req.body);
      res.status(201).json(out);
    } catch (err) {
      const map = { SELF_VOTE_FORBIDDEN: 403, DAILY_CAP_REACHED: 429, UNKNOWN_RULE: 400 };
      res.status(map[err.code] ?? 500).json({ code: err.code ?? 'INTERNAL', message: err.message, traceId: req.id });
    }
  });

  router.get('/balance/:userId', async (req, res) => {
    res.json({ userId: req.params.userId, total: await awardPoints.repo.getBalance(req.params.userId) });
  });

  return router;
}
