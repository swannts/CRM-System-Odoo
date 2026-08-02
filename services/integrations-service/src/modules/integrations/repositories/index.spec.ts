import { IntegrationConnectionRepository } from './index.js';
import { db } from '../db.js';
import { encryptToken, decryptToken } from '@mymanager/node-service-kit';

jest.mock('../db.js', () => ({
  db: {
    integrationConnection: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    }
  }
}));

jest.mock('@mymanager/node-service-kit', () => ({
  encryptToken: jest.fn((val) => `enc:${val}`),
  decryptToken: jest.fn((val) => val.replace('enc:', '')),
}));

describe('IntegrationConnectionRepository', () => {
  let repository: IntegrationConnectionRepository;

  beforeEach(() => {
    repository = new IntegrationConnectionRepository();
    jest.clearAllMocks();
  });

  it('should encrypt tokens on create', async () => {
    const data = {
      userId: 'user1',
      provider: 'google',
      accessToken: 'plain-token',
      refreshToken: 'plain-refresh',
    };

    (db as any).integrationConnection.create.mockResolvedValue({
      id: '1',
      ...data,
      accessToken: 'enc:plain-token',
      refreshToken: 'enc:plain-refresh',
    });

    const result = await repository.create(data as any);

    expect(encryptToken).toHaveBeenCalledWith('plain-token');
    expect(encryptToken).toHaveBeenCalledWith('plain-refresh');
    expect((db as any).integrationConnection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accessToken: 'enc:plain-token',
        refreshToken: 'enc:plain-refresh',
      })
    });
    expect(result.accessToken).toBe('plain-token'); // Decrypted in return
  });

  it('should decrypt tokens on findUnique', async () => {
    (db as any).integrationConnection.findUnique.mockResolvedValue({
      id: '1',
      userId: 'user1',
      provider: 'google',
      accessToken: 'enc:plain-token',
      refreshToken: 'enc:plain-refresh',
    });

    const result = await repository.findByUserAndProvider('user1', 'google');

    expect(decryptToken).toHaveBeenCalledWith('enc:plain-token');
    expect(result.accessToken).toBe('plain-token');
  });
});
