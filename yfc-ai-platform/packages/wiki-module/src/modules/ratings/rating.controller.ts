import { Router, type Request, type Response, type NextFunction } from 'express';
import type { RatingService } from './rating.service.js';
// POST /api/v1/posts/:id/ratings { usefulness, accuracy, novelty }
export function ratingRouter(service: RatingService): Router {
  const r = Router({ mergeParams: true });
  r.post('/:id/ratings', (req: Request, res: Response, next: NextFunction) => (async () => {
    await service.rate(req.user!, req.params.id, req.body);
    res.status(201).json({ ok: true });
  })().catch(next));
  return r;
}
