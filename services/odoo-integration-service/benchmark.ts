import { SyncService } from './src/modules/sync/sync.service.js';
import { OdooClientService } from './src/modules/odoo-base/odoo-client.service.js';
import { PrismaService } from './src/database/prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

// Patch axios for the get request
import axios from 'axios';
const originalGet = axios.get;
axios.get = async (url, config) => {
  if (url.includes('magento/customers')) {
    return {
      data: {
        data: {
          items: Array.from({ length: 1000 }).map((_, i) => ({
            id: i,
            firstname: `Test${i}`,
            lastname: `User${i}`,
            email: `test${i}@example.com`,
          })),
        },
      },
    } as any;
  }
  return originalGet(url, config);
};

// Simulate network delay for JSON-RPC
const originalPost = axios.post;
axios.post = async (url, data, config) => {
  if (url.includes('jsonrpc')) {
    await new Promise(resolve => setTimeout(resolve, 5)); // 5ms delay per request
  }
  return originalPost(url, data, config);
};


async function run() {
  process.env.MAGENTO_INTEGRATION_URL = 'http://magento.local';
  const config = new ConfigService();
  const odooClient = new OdooClientService(config);

  const prisma = {
    contactMap: {
      upsert: async () => ({}),
    }
  } as unknown as PrismaService;

  const syncService = new SyncService(odooClient, prisma);

  // Warmup
  await syncService.syncMagentoCustomers('org1');

  // Actual test
  const start = Date.now();
  await syncService.syncMagentoCustomers('org1');
  const end = Date.now();
  console.log(`Sync 1000 items took ${end - start}ms`);
}

run();
