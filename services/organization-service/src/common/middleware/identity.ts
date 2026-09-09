import { Request, Response, NextFunction } from 'express';
import { requireIdentityContext } from '@mymanager/node-service-kit';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.js';

export function identityMiddleware(req: AuthenticatedRequest | Request, res: Response, next: NextFunction) {
  // The organization service is the membership authority. It must verify the
  // token first, then resolve membership locally without calling itself.
  return requireIdentityContext(req, res, next, { validateMembership: false });
}
