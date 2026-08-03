import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Email Sync Service - Unit Tests', () => {
  test('email template content parsing & merge fields replacement', () => {
    const template = 'Hello {{name}}, your appointment is at {{time}}.';
    const variables: Record<string, string> = { name: 'John Doe', time: '10:00 AM' };

    const render = (tpl: string, vars: Record<string, string>) => {
      return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
    };

    const result = render(template, variables);
    assert.equal(result, 'Hello John Doe, your appointment is at 10:00 AM.');
  });

  test('email address validation routine', () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    assert.equal(isValidEmail('user@example.com'), true);
    assert.equal(isValidEmail('invalid-email'), false);
    assert.equal(isValidEmail('test@sub.domain.co'), true);
  });

  test('oauth token expiration check', () => {
    const isTokenExpired = (expiresAt: Date, bufferMs = 60000) => {
      return new Date().getTime() + bufferMs >= expiresAt.getTime();
    };

    const futureDate = new Date(Date.now() + 3600000); // 1 hour ahead
    const pastDate = new Date(Date.now() - 1000); // 1 sec ago

    assert.equal(isTokenExpired(futureDate), false);
    assert.equal(isTokenExpired(pastDate), true);
  });
});
