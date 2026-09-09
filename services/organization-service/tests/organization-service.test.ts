import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const { app } = createApp();

describe('Organization Service - Unit & API Tests', () => {
  test('header parsing helper for X-Org-Id & X-User-Id', () => {
    const extractIdentityHeaders = (headers: Record<string, string | undefined>) => {
      return {
        orgId: headers['x-org-id'] || 'default-org',
        userId: headers['x-user-id'] || 'default-user',
      };
    };

    const headers = { 'x-org-id': 'org-123', 'x-user-id': 'user-456' };
    const identity = extractIdentityHeaders(headers);

    assert.equal(identity.orgId, 'org-123');
    assert.equal(identity.userId, 'user-456');
  });

  test('GET /health endpoint response', async () => {
    const server = await new Promise<any>((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const responseData = await response.json();
    await new Promise<void>((resolve, reject) => server.close((error: Error | undefined) => error ? reject(error) : resolve()));

    assert.equal(response.status, 200);
    assert.equal(responseData?.status, 'ok');
    assert.equal(responseData?.service, 'organization-service (TS)');
  });
});
