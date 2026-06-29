// wiki-module/src/modules/posts/post.controller.ts  (Controller層)
// OpenAPI: /posts (GET,POST), /posts/{id} (GET,PUT,DELETE), /posts/{id}/transition (POST)
import { Router, type Request, type Response, type NextFunction } from 'express';
import type { PostService } from './post.service.js';
import type { PostListQuery, TransitionAction } from './post.dto.js';
import { AppError, Errors } from '../../shared/errors.js';

const ACTIONS: TransitionAction[] = ['submit', 'approve', 'publish', 'archive', 'restore'];

export function postRouter(service: PostService): Router {
  const r = Router();
  const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

  // GET /posts  一覧・検索
  r.get('/', wrap(async (req, res) => {
    const q: PostListQuery = {
      q: str(req.query.q), category: str(req.query.category),
      postType: str(req.query.postType) as any, status: str(req.query.status) as any,
      unresolvedOnly: req.query.unresolvedOnly === 'true',
      sort: (str(req.query.sort) as any) ?? 'newest',
      page: int(req.query.page, 1), size: int(req.query.size, 20),
    };
    res.json(await service.list(q));
  }));

  // POST /posts  作成
  r.post('/', wrap(async (req, res) => {
    res.status(201).json(await service.create(req.user!, req.body));
  }));

  // GET /posts/:id  詳細
  r.get('/:id', wrap(async (req, res) => {
    res.json(await service.get(req.params.id));
  }));

  // PUT /posts/:id  更新
  r.put('/:id', wrap(async (req, res) => {
    res.json(await service.update(req.user!, req.params.id, req.body));
  }));

  // DELETE /posts/:id  論理削除
  r.delete('/:id', wrap(async (req, res) => {
    await service.remove(req.user!, req.params.id);
    res.status(204).end();
  }));

  // POST /posts/:id/transition  状態遷移
  r.post('/:id/transition', wrap(async (req, res) => {
    const action = req.body?.action as TransitionAction;
    if (!ACTIONS.includes(action)) throw Errors.validation(`actionは ${ACTIONS.join('|')}`);
    res.json(await service.transition(req.user!, req.params.id, action));
  }));

  return r;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError)
    return res.status(err.httpStatus).json({ code: err.code, message: err.message, traceId: req.id });
  // 構造化エラーログ（個人情報・機密は載せない）
  console.error(JSON.stringify({ level: 'error', event: 'unhandled', traceId: req.id,
    message: (err as any)?.message, stack: (err as any)?.stack?.split('\n').slice(0, 3).join(' | ') }));
  res.status(500).json({ code: 'INTERNAL', message: 'internal error', traceId: req.id });
}

const str = (v: unknown) => (typeof v === 'string' && v.length ? v : undefined);
const int = (v: unknown, d: number) => { const n = parseInt(String(v), 10); return Number.isFinite(n) ? n : d; };
