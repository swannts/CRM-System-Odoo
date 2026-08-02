import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: any, res: any, next: any) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', String(requestId));
  next();
}
