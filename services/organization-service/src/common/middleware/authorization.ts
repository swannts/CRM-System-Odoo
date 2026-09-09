import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.js';
import { MembershipService } from '../../modules/organization/services/organization.service.js';

const svc = new MembershipService();

export const ORG_ROLES = ['org_owner', 'org_admin', 'org_manager', 'org_staff', 'org_viewer'] as const;

export async function attachRoleContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const membership = await svc.resolveMembership(req.identity.orgId, req.identity.userId);

    if (!membership || membership.metadata && typeof membership.metadata === 'object' && (membership.metadata as any).status === 'disabled') {
      return res.status(403).json({ message: 'User is not an active member of this organization.' });
    }

    req.identity = {
      ...req.identity,
      orgRole: membership?.role ?? null,
      permissions: Array.isArray(membership?.permissions)
        ? membership.permissions.filter((value: unknown): value is string => typeof value === 'string')
        : [],
      membership,
    };

    return next();
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Unable to resolve membership context.' });
  }
}

export function requireOrgRoles(roles: string[], { allowPlatformAdmin = true } = {}) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const platformRoles = req.identity?.platformRoles ?? [];
    if (allowPlatformAdmin && platformRoles.includes('platform_admin')) {
      return next();
    }

    if (req.identity?.orgRole && roles.includes(req.identity.orgRole)) {
      return next();
    }

    return res.status(403).json({
      message: 'You do not have permission to perform this action.',
      requiredOrgRoles: roles,
      currentOrgRole: req.identity?.orgRole ?? null,
    });
  };
}
