import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';

describe('Email Sync Service - E2E API Tests', () => {
  test('GET /health returns 200 and healthy status', async () => {
    // Basic HTTP handler mock / invocation check
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

    // Invoke router directly
    await new Promise<void>((resolve) => {
      app(req, res, () => resolve());
      if (responseData) resolve();
    });

    assert.equal(statusCode, 200);
    assert.equal(responseData?.status, 'healthy');
    assert.equal(responseData?.service, 'email-sync-service');
  });
});
