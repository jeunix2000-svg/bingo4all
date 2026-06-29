import { Router, type Request, type Response, type NextFunction } from 'express';
import type { VoteService } from './vote.service.js';
import { Errors } from '../../shared/errors.js';
// POST /api/v1/posts/:id/votes  { direction: 1 | -1 }
export function voteRouter(service: VoteService): Router {
  const r = Router({ mergeParams: true });
  r.post('/:id/votes', (req: Request, res: Response, next: NextFunction) => (async () => {
    const dir = req.body?.direction;
    if (dir !== 1 && dir !== -1) throw Errors.validation('directionは 1 か -1');
    await service.vote(req.user!, req.params.id, dir);
    res.status(201).json({ ok: true });
  })().catch(next));
  return r;
}
