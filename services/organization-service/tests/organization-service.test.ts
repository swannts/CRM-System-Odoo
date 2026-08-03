import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

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
    const req: any = { method: 'GET', url: '/health', headers: {} };
    let responseData: any = null;
    let statusCode = 200;

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        return this;
      },
    };

    await new Promise<void>((resolve) => {
      app(req, res, () => resolve());
      if (responseData) resolve();
    });

    assert.equal(statusCode, 200);
    assert.equal(responseData?.status, 'healthy');
    assert.equal(responseData?.service, 'organization-service');
  });
});
