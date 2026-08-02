import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactsModule } from './modules/contacts/contacts.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { AccountingModule } from './modules/accounting/accounting.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { SyncModule } from './modules/sync/sync.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { PosModule } from './modules/pos/pos.module.js';
import { MagentoCompatibilityModule } from './modules/magento-compatibility/magento-compatibility.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { OdooAdapterModule } from './modules/odoo-adapter/odoo-adapter.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ScoresModule } from './modules/scores/scores.module.js';
import { SupportModule } from './modules/support/support.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { FormBuilderModule } from './modules/form-builder/form-builder.module.js';
import { WebbuilderModule } from './modules/webbuilder/webbuilder.module.js';
import { ReputationModule } from './modules/reputation/reputation.module.js';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { configuration } from './config/configuration.js';
import { databaseConfig } from './config/database.config.js';
import { validateEnv } from './config/env.validation.js';
import { jwtConfig } from './config/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig, jwtConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    ContactsModule,
    CrmModule,
    SalesModule,
    AccountingModule,
    InventoryModule,
    SyncModule,
    AnalyticsModule,
    DashboardModule,
    PostsModule,
    ProjectsModule,
    PosModule,
    EmployeesModule,
    BookingModule,
    CalendarModule,
    ScoresModule,
    SupportModule,
    HealthModule,
    FormBuilderModule,
    WebbuilderModule,
    ReputationModule,
    OdooAdapterModule,
    MagentoCompatibilityModule,
  ],
})
export class AppModule {}
