import { Request, Response, NextFunction } from 'express';

export function identityMiddleware(req: Request, res: Response, next: NextFunction) {
  const orgId = req.header('X-Org-Id');
  const userId = req.header('X-User-Id');

  if (!orgId || !userId) {
    return res.status(401).json({ message: 'Missing identity context headers (X-Org-Id, X-User-Id).' });
  }

  (req as any).identity = { orgId, userId };
  next();
}

export interface AuthenticatedRequest extends Request {
  identity: {
    orgId: string;
    userId: string;
  };
}

export type Identity = AuthenticatedRequest['identity'];
