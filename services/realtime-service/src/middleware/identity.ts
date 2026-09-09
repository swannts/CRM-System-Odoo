import { Request, Response, NextFunction } from 'express';
import { requireIdentityContext } from '@mymanager/node-service-kit';

export function identityMiddleware(req: Request, res: Response, next: NextFunction) {
  return requireIdentityContext(req, res, next);
}

export interface AuthenticatedRequest extends Request {
  identity: {
    orgId: string;
    userId: string;
  };
}
