// 门户浏览器跨域访问 Wiki API 用 CORS（Render 公网部署）
import type { Request, Response, NextFunction } from 'express';

const DEFAULT_HEADERS =
  'Content-Type, x-user-id, x-user-role, x-user-name, x-user-dept, x-request-id';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const configured = process.env.PORTAL_ORIGIN?.trim();
  const origin = req.header('Origin');
  if (configured === '*') {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (configured && origin === configured) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (!configured && origin) {
    // PoC: 未设置 PORTAL_ORIGIN 时反射请求 Origin
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', DEFAULT_HEADERS);
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}
