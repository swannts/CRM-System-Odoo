export interface AppConfiguration {
  nodeEnv: string;
  port: number;
  allowedOrigin: string;
  apiPrefix: string;
}

export function configuration(): AppConfiguration {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 7200),
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
    apiPrefix: 'v1/odoo',
  };
}
