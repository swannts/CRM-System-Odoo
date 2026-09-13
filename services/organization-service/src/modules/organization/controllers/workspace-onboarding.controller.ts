import { createHash, randomBytes } from 'node:crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@mymanager/node-service-kit';
import { db } from '../../../database/prisma/prisma.client.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../services/rbac-catalog.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const active = (member: any) => member && member.metadata?.status !== 'disabled' && member.metadata?.active !== false;
const fail = (status: number, message: string) => Object.assign(new Error(message), { status });

export function registerWorkspaceOnboarding(app: Express, organizationAuth: any[], ownerOrAdmin: any) {
  const tokenOnly = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const claims = await verifyAccessToken(req.header('Authorization'));
      if (!claims.sub) throw new Error('Missing subject');
      (req as any).claims = claims;
      next();
    } catch { res.status(401).json({ message: 'Invalid or expired access token.' }); }
  };
  const handler = (fn: (req: any) => Promise<any>) => async (req: Request, res: Response) => {
    try { res.json({ data: await fn(req) }); }
    catch (error: any) { res.status(error.status || 503).json({ message: error.status ? error.message : 'Workspace operation failed. Please retry.' }); }
  };

  app.get('/v1/workspaces', tokenOnly, handler(async req => {
    const members = await db.organizationMembership.findMany({ where: { userId: req.claims.sub }, include: { organization: true } });
    return members.filter(active).map(member => ({ id: member.organizationId, name: member.organization.name, role: member.role }));
  }));

  app.post('/v1/workspaces', tokenOnly, handler(async req => {
    const { requestId, name } = req.body || {};
    if (!uuid.test(requestId || '') || typeof name !== 'string' || !name.trim() || name.length > 120) throw fail(400, 'A request UUID and workspace name (1–120 characters) are required.');
    return db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${requestId}))`;
      const existing = await tx.organization.findUnique({ where: { id: requestId } });
      if (existing) {
        const member = await tx.organizationMembership.findUnique({ where: { organizationId_userId: { organizationId: requestId, userId: req.claims.sub } } });
        if (!active(member) || member!.role !== 'org_owner') throw fail(409, 'Request ID already used.');
        return existing;
      }
      return tx.organization.create({ data: {
        id: requestId, name: name.trim(), memberships: { create: { userId: req.claims.sub, role: 'org_owner', permissions: DEFAULT_ROLE_PERMISSIONS.org_owner } },
      } });
    });
  }));

  app.get('/v1/invitations', ...organizationAuth, ownerOrAdmin, handler(async req => db.organizationInvitation.findMany({
    where: { organizationId: req.identity.orgId }, orderBy: { createdAt: 'desc' }, take: 100,
    select: { id: true, email: true, role: true, expiresAt: true, revokedAt: true, acceptedAt: true },
  })));

  app.post('/v1/invitations', ...organizationAuth, ownerOrAdmin, handler(async req => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const role = req.body?.role || 'org_staff';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw fail(400, 'A valid email is required.');
    if (!['org_admin', 'org_manager', 'org_staff', 'org_viewer'].includes(role)) throw fail(400, 'Invalid invitation role.');
    const token = randomBytes(32).toString('base64url');
    const invitation = await db.organizationInvitation.create({ data: {
      organizationId: req.identity.orgId, email, role, tokenHash: digest(token), invitedBy: req.identity.userId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    } });
    return { id: invitation.id, token, email, expiresAt: invitation.expiresAt };
  }));

  app.delete('/v1/invitations/:id', ...organizationAuth, ownerOrAdmin, handler(async req => {
    if (!uuid.test(req.params.id)) throw fail(400, 'Invalid invitation ID.');
    return db.$transaction(async tx => {
      const invite = await tx.organizationInvitation.findFirst({ where: { id: req.params.id, organizationId: req.identity.orgId } });
      if (!invite) throw fail(404, 'Invitation not found.');
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${invite.tokenHash}))`;
      const result = await tx.organizationInvitation.updateMany({
        where: { id: invite.id, organizationId: req.identity.orgId, acceptedAt: null }, data: { revokedAt: new Date() },
      });
      if (!result.count) throw fail(409, 'Invitation already accepted.');
      return { revoked: true };
    });
  }));

  app.post('/v1/invitations/accept', tokenOnly, handler(async req => {
    const token = req.body?.token;
    if (typeof token !== 'string' || token.length !== 43) throw fail(400, 'Invalid invitation.');
    if (req.claims.email_verified !== true || typeof req.claims.email !== 'string') throw fail(403, 'Verify your email before accepting an invitation.');
    const tokenHash = digest(token);
    return db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tokenHash}))`;
      const invite = await tx.organizationInvitation.findUnique({ where: { tokenHash } });
      if (!invite || invite.revokedAt || invite.email !== req.claims.email.toLowerCase()) throw fail(403, 'Invitation is unavailable for this account.');
      if (invite.acceptedBy && invite.acceptedBy !== req.claims.sub) throw fail(409, 'Invitation already used.');
      if (!invite.acceptedBy && invite.expiresAt <= new Date()) throw fail(410, 'Invitation expired.');
      const existing = await tx.organizationMembership.findUnique({ where: { organizationId_userId: { organizationId: invite.organizationId, userId: req.claims.sub } } });
      if (existing && !active(existing)) throw fail(403, 'Your membership has been disabled.');
      // Accepting an invitation must never downgrade an existing member or restore revoked access.
      if (invite.acceptedBy && !existing) throw fail(403, 'Membership has been removed.');
      const membership = existing || await tx.organizationMembership.create({ data: {
        organizationId: invite.organizationId, userId: req.claims.sub, role: invite.role, permissions: DEFAULT_ROLE_PERMISSIONS[invite.role],
      } });
      await tx.organizationInvitation.update({ where: { id: invite.id }, data: { acceptedBy: req.claims.sub, acceptedAt: invite.acceptedAt || new Date() } });
      return { organizationId: membership.organizationId };
    });
  }));
}
