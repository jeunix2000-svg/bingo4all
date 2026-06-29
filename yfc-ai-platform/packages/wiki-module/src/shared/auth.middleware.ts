// wiki-module/src/shared/auth.middleware.ts
// 認証ミドルウェア（骨格）。本番は Entra OIDC のJWTを検証し principal を組み立てる。
// 開発/テストでは x-user-id / x-user-role ヘッダから principal を構築する。
import type { Request, Response, NextFunction } from 'express';
import { Errors } from './errors.js';

export interface Principal { id: string; role: string; department?: string | null; }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: Principal; id?: string; } }
}

export function auth(req: Request, _res: Response, next: NextFunction) {
  const id = req.header('x-user-id');
  const role = req.header('x-user-role') ?? 'EMPLOYEE';
  if (!id) return next(Errors.unauthorized());
  req.user = { id, role, department: req.header('x-user-dept') ?? null };
  req.id = req.header('x-request-id') ?? cryptoRandom();
  next();
}
function cryptoRandom() { return Math.random().toString(36).slice(2); }
