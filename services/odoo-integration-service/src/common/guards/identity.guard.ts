import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { requireOrganizationMembership, verifyAccessToken } from '@mymanager/node-service-kit';
import { Identity } from '../interfaces/identity.interface.js';

@Injectable()
export class IdentityGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];

    if (!orgId) {
      throw new UnauthorizedException('Missing selected organization');
    }

    let token: Record<string, any>;
    try {
      token = await verifyAccessToken(request.headers.authorization, {
        issuer: process.env.KEYCLOAK_ISSUER,
        audience: process.env.KEYCLOAK_CLIENT_ID || 'mymanager-web',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    const userId = token.sub;
    if (typeof userId !== 'string') throw new UnauthorizedException('Token has no subject');

    const membership = await requireOrganizationMembership({
      orgId: orgId as string,
      userId,
      authorization: request.headers.authorization,
    });
    if (!membership) {
      throw new UnauthorizedException('User is not an active member of this organization');
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !['org_owner', 'org_admin', 'org_manager', 'org_staff', 'sales_staff', 'admin_manager'].includes(membership.role)) {
      throw new ForbiddenException('Your organization role cannot modify these records');
    }

    const identity: Identity = {
      userId,
      orgId: orgId as string,
      authorization: request.headers.authorization,
      roles: Array.isArray(token.realm_access?.roles) ? token.realm_access.roles : [],
    };

    request.identity = identity;
    return true;
  }
}
