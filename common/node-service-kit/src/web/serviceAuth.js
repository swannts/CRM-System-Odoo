const tokenCache = new Map();

function keycloakTokenUrl() {
  const base = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
  const realm = process.env.KEYCLOAK_REALM || 'mymanager';
  return `${base.replace(/\/$/, '')}/realms/${realm}/protocol/openid-connect/token`;
}

export async function getServiceAccessToken() {
  const clientId = process.env.SERVICE_CLIENT_ID;
  const clientSecret = process.env.SERVICE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SERVICE_CLIENT_ID and SERVICE_CLIENT_SECRET are required for background jobs');
  }

  const cached = tokenCache.get(clientId);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.authorization;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(keycloakTokenUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`Service token request failed (${response.status})`);
  const payload = await response.json();
  if (typeof payload.access_token !== 'string' || !payload.access_token) {
    throw new Error('Service token response did not contain an access token');
  }

  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 60;
  const authorization = `Bearer ${payload.access_token}`;
  tokenCache.set(clientId, { authorization, expiresAt: Date.now() + expiresIn * 1000 });
  return authorization;
}
