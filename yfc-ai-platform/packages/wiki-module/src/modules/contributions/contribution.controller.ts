import { Router, type Request, type Response, type NextFunction } from 'express';
import type { ContributionService } from './contribution.service.js';
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// /api/v1/posts/:id/contributions (GET, POST)
export function postContributionsRouter(s: ContributionService): Router {
  const r = Router({ mergeParams: true });
  r.get('/:id/contributions', wrap(async (req, res) => { res.json(await s.list(req.params.id)); }));
  r.post('/:id/contributions', wrap(async (req, res) => { res.status(201).json(await s.add(req.user!, req.params.id, req.body)); }));
  return r;
}
// /api/v1/contributions/:cid/accept (POST)
export function contributionsRouter(s: ContributionService): Router {
  const r = Router();
  r.post('/:cid/accept', wrap(async (req, res) => { res.json(await s.accept(req.user!, req.params.cid)); }));
  return r;
}
