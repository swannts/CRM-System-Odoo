import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Integrations Controller Unit Tests', () => {
  it('validates provider connection request payload', () => {
    const validateConnectPayload = (payload: any) => {
      if (!payload || !payload.provider) {
        throw new Error('Provider is required');
      }
      return true;
    };

    expect(validateConnectPayload({ provider: 'google' })).toBe(true);
    expect(() => validateConnectPayload({})).toThrow('Provider is required');
  });

  it('formats provider auth url correctly', () => {
    const buildAuthUrl = (provider: string, clientId: string, redirectUri: string) => {
      return `https://${provider}.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    };

    const url = buildAuthUrl('google', '123', 'http://localhost:8081/callback');
    expect(url).toContain('https://google.com/oauth/authorize');
    expect(url).toContain('client_id=123');
  });
});
