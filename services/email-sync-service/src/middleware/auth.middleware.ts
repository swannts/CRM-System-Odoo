import { requireIdentityContext } from '@mymanager/node-service-kit';
import type { RequestHandler } from 'express';

export const requireIdentityMiddleware: RequestHandler = (req, res, next) => {
  return requireIdentityContext(req, res, next);
};
