import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SyncService } from './sync.service.js';
import { IdentityGuard } from '../../common/guards/identity.guard.js';
import { CurrentUser } from '../../common/decorators/user.decorator.js';
import type { Identity } from '../../common/interfaces/identity.interface.js';

@ApiTags('Sync')
@UseGuards(IdentityGuard)
@ApiHeader({ name: 'x-org-id', required: true })
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('magento/customers')
  @ApiOperation({ summary: 'Sync customers from Magento to Odoo' })
  async syncCustomers(@CurrentUser() user: Identity) {
    return this.syncService.syncMagentoCustomers(user.orgId, user.authorization);
  }

  @Post('magento/orders')
  @ApiOperation({ summary: 'Sync orders from Magento to Odoo' })
  async syncOrders(@CurrentUser() user: Identity) {
    return this.syncService.syncMagentoOrders(user.orgId, user.authorization);
  }

  @Post('magento/all')
  @ApiOperation({ summary: 'Sync everything from Magento to Odoo' })
  async syncAll(@CurrentUser() user: Identity) {
    const customers = await this.syncService.syncMagentoCustomers(user.orgId, user.authorization);
    const orders = await this.syncService.syncMagentoOrders(user.orgId, user.authorization);
    return {
      customers,
      orders,
      syncedOrders: orders.synced,
    };
  }
}
