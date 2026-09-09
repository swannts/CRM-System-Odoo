import {
  extractPlatformRolesFromPayload,
  requireOrganizationMembership,
  verifyAccessToken,
} from "./authz.js";

export async function requireIdentityContext(req, res, next, { validateMembership = true } = {}) {
  const orgId = req.header("X-Org-Id") || null;
  if (!orgId) {
    return res.status(401).json({ message: "Missing selected organization." });
  }

  try {
    const authorization = req.header("Authorization");
    const claims = await verifyAccessToken(authorization, {
      issuer: process.env.KEYCLOAK_ISSUER,
      audience: process.env.KEYCLOAK_CLIENT_ID || "mymanager-web",
    });
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    if (!userId) return res.status(401).json({ message: "Token has no subject." });

    let membership = null;
    if (validateMembership) {
      membership = await requireOrganizationMembership({
        orgId,
        userId,
        authorization,
      });
      if (!membership) {
        return res.status(403).json({ message: "User is not an active member of this organization." });
      }
    }

    req.identity = {
      userId,
      orgId,
      authorization,
      token: claims,
      platformRoles: extractPlatformRolesFromPayload(claims),
      ...(membership
        ? {
            orgRole: membership.role || null,
            permissions: Array.isArray(membership.permissions) ? membership.permissions : [],
            membership,
          }
        : {}),
    };
    return next();
  } catch (error) {
    const status = error?.message?.startsWith("Membership resolve failed") ? 503 : 401;
    return res.status(status).json({
      message: status === 503 ? "Organization membership service unavailable." : "Invalid or expired access token.",
      code: error?.code || "INVALID_TOKEN",
    });
  }
}
