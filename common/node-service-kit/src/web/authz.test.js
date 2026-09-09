import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import { requireOrganizationMembership, verifyAccessToken } from "./authz.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const issuer = "https://keycloak.test/realms/mymanager";
const audience = "mymanager-web";
const keyId = "test-key";

function accessToken(payload = {}) {
  return jwt.sign(
    { sub: "user-1", iss: issuer, aud: audience, exp: Math.floor(Date.now() / 1000) + 3600, ...payload },
    privateKey,
    { algorithm: "RS256", keyid: keyId },
  );
}

function mockKeycloakAndMembership(membershipResponse) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/protocol/openid-connect/certs")) {
      return new Response(JSON.stringify({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: keyId, kty: "RSA", use: "sig", alg: "RS256" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(membershipResponse.body || "", { status: membershipResponse.status, headers: { "content-type": "application/json" } });
  };
  return () => {
    globalThis.fetch = originalFetch;
    return calls;
  };
}

test("rejects missing bearer tokens before contacting Keycloak", async () => {
  await assert.rejects(verifyAccessToken(null), (error) => error.message === "MISSING_BEARER_TOKEN");
});

test("rejects unsigned and forged JWTs", async () => {
  const forged = `eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.${Buffer.from(JSON.stringify({ sub: "attacker", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;
  await assert.rejects(verifyAccessToken(`Bearer ${forged}`), (error) => error.message === "INVALID_TOKEN_HEADER");
});

test("requires an expiration claim on an otherwise validly signed token", async () => {
  const restore = mockKeycloakAndMembership({ status: 404, body: "" });
  const token = jwt.sign({ sub: "user-1", iss: issuer, aud: audience }, privateKey, { algorithm: "RS256", keyid: keyId });

  await assert.rejects(
    verifyAccessToken(`Bearer ${token}`, { issuer, audience }),
    (error) => error.message === "TOKEN_EXPIRATION_REQUIRED",
  );
  restore();
});

test("membership resolution derives identity from the bearer token", async () => {
  const restore = mockKeycloakAndMembership({
    status: 200,
    body: JSON.stringify({ data: { role: "org_staff", permissions: ["crm:view"] } }),
  });
  const token = accessToken();

  const membership = await requireOrganizationMembership({
    organizationServiceUrl: "http://organization-service:7010",
    orgId: "org-1",
    userId: "attacker-supplied-id",
    authorization: `Bearer ${token}`,
  });

  assert.deepEqual(membership, { role: "org_staff", permissions: ["crm:view"] });
  const calls = restore();
  const membershipRequest = calls.find((call) => call.url.includes("/v1/memberships/resolve"));
  assert.equal(membershipRequest.init.headers["X-Org-Id"], "org-1");
  assert.equal(membershipRequest.init.headers["X-User-Id"], undefined);
});
