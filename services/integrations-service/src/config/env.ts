export const config = {
  serviceName: 'integrations-service',
  port: Number(process.env.PORT || 7140),
  jsonLimit: '10mb',
  kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
  magentoServiceUrl: process.env.MAGENTO_INTEGRATION_SERVICE_URL,
  odooServiceUrl: process.env.ODOO_INTEGRATION_SERVICE_URL,
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'mymanager_token',
};
