import { Request, Response, NextFunction } from 'express';
import { extractPlatformRolesFromAuthHeader, getHighestPriorityRole } from '@mymanager/node-service-kit';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.js';

export function identityMiddleware(req: AuthenticatedRequest | Request, res: Response, next: NextFunction) {
  const orgId = req.header('X-Org-Id');
  const userId = req.header('X-User-Id');
  const authorization = req.header('Authorization');

  if (!orgId || !userId) {
    return res.status(401).json({ message: 'Missing identity context headers (X-Org-Id, X-User-Id).' });
  }

  const platformRoles = extractPlatformRolesFromAuthHeader(authorization);

  (req as any).identity = {
    orgId,
    userId,
    platformRoles,
    platformRole: getHighestPriorityRole(platformRoles),
  };
  next();
}
