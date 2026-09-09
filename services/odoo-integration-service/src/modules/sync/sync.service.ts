import { Injectable, Logger } from '@nestjs/common';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import axios from 'axios';
import { getServiceAccessToken } from '@mymanager/node-service-kit';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly magentoUrl = process.env.MAGENTO_INTEGRATION_URL;

  constructor(
    private readonly odooClient: OdooClientService,
    private readonly prisma: PrismaService,
  ) {}

  async syncMagentoCustomers(orgId: string, authorization?: string) {
    if (!this.magentoUrl) {
      throw new Error('Missing MAGENTO_INTEGRATION_URL');
    }
    const requestAuthorization = authorization?.startsWith('Bearer ')
      ? authorization
      : await getServiceAccessToken();
    this.logger.log(`Starting Magento customer sync for org: ${orgId}`);
    try {
      const response = await axios.get(
        `${this.magentoUrl}/v1/magento/customers`,
        {
          headers: { Authorization: requestAuthorization, 'x-org-id': orgId },
        },
      );

      const customers = response.data?.data?.items || [];
      let created = 0;
      let updated = 0;

      if (customers.length === 0) {
        return { total: 0, created, updated };
      }

      // Batch fetch existing partners from Odoo
      const emails = customers.map((c: any) => c.email).filter(Boolean);
      const refs = customers.map((c: any) => `MAG-${c.id}`);

      // We need to fetch ID and the fields we match against to populate our Map
      const existingPartners = await this.odooClient.searchRead(
        'res.partner',
        ['|', ['email', 'in', emails], ['ref', 'in', refs]],
        ['id', 'email', 'ref'],
      );

      // Build a lookup map by ref and email
      const partnerByRef = new Map<string, number>();
      const partnerByEmail = new Map<string, number>();

      for (const p of existingPartners) {
        if (p.ref) partnerByRef.set(p.ref, p.id);
        if (p.email) partnerByEmail.set(p.email, p.id);
      }

      for (const customer of customers) {
        const ref = `MAG-${customer.id}`;

        // Match logic: ref matches first, then email
        const existingId =
          partnerByRef.get(ref) || partnerByEmail.get(customer.email);

        const partnerData = {
          name: `${customer.firstname} ${customer.lastname}`,
          email: customer.email,
          ref,
          customer_rank: 1,
          comment: `Synced from Magento ID: ${customer.id}`,
        };

        let odooId: number;
        if (existingId !== undefined) {
          odooId = existingId;
          await this.odooClient.execute('res.partner', 'write', [
            [odooId],
            partnerData,
          ]);
          updated++;
        } else {
          odooId = await this.odooClient.execute('res.partner', 'create', [
            partnerData,
          ]);
          created++;
        }

        // Ensure Prisma map exists
        if (typeof odooId === 'number') {
          await this.prisma.contactMap.upsert({
            where: { odooId },
            update: { status: 'client' },
            create: { odooId, status: 'client' },
          });
        }
      }

      return { total: customers.length, created, updated };
    } catch (error) {
      this.logger.error(`Magento customer sync failed: ${error.message}`);
      throw error;
    }
  }

  async syncMagentoOrders(orgId: string, authorization?: string) {
    if (!this.magentoUrl) {
      throw new Error('Missing MAGENTO_INTEGRATION_URL');
    }
    const requestAuthorization = authorization?.startsWith('Bearer ')
      ? authorization
      : await getServiceAccessToken();
    this.logger.log(`Starting Magento order sync for org: ${orgId}`);
    try {
      const response = await axios.get(`${this.magentoUrl}/v1/magento/orders`, {
        headers: { Authorization: requestAuthorization, 'x-org-id': orgId },
      });

      const orders = response.data?.data?.items || [];
      let synced = 0;
      let skipped = 0;

      for (const order of orders) {
        // Check if order already exists in Odoo (by origin/ref)
        const existing = await this.odooClient.searchRead(
          'sale.order',
          [['name', '=', `MAG-${order.increment_id || order.entity_id}`]],
          ['id'],
        );

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // 1. Find or create partner
        const partners = await this.odooClient.searchRead(
          'res.partner',
          [['email', '=', order.customer_email]],
          ['id'],
        );

        let partnerId;
        if (partners && partners.length > 0) {
          partnerId = partners[0].id;
        } else {
          partnerId = await this.odooClient.execute('res.partner', 'create', [
            {
              name:
                `${order.customer_firstname} ${order.customer_lastname}`.trim() ||
                order.customer_email,
              email: order.customer_email,
              customer_rank: 1,
            },
          ]);
        }

        // Ensure Prisma map exists for the partner
        if (typeof partnerId === 'number') {
          await this.prisma.contactMap.upsert({
            where: { odooId: partnerId },
            update: {},
            create: { odooId: partnerId, status: 'client' },
          });
        }

        // 2. Map items to order lines
        const orderLines = (order.items || []).map((item: any) => [
          0,
          0,
          {
            name: item.name || `Product SKU: ${item.sku}`,
            product_uom_qty: item.qty_ordered || 1,
            price_unit: item.price || 0,
          },
        ]);

        // 3. Create Sale Order
        await this.odooClient.execute('sale.order', 'create', [
          {
            partner_id: partnerId,
            name: `MAG-${order.increment_id || order.entity_id}`,
            date_order: order.created_at,
            order_line: orderLines,
            note: `Magento Order ID: ${order.entity_id}. Status: ${order.status}`,
          },
        ]);

        synced++;
      }

      return { total: orders.length, synced, skipped };
    } catch (error) {
      this.logger.error(`Magento order sync failed: ${error.message}`);
      throw error;
    }
  }
}
