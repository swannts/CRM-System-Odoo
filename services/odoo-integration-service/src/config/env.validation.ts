import { BadRequestException } from '@nestjs/common';

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV || process.env.NODE_ENV || 'development');
  const allowedOrigin = String(config.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN || '*');

  if (nodeEnv === 'production' && !allowedOrigin) {
    throw new BadRequestException('ALLOWED_ORIGIN must be set in production.');
  }
  if (nodeEnv === 'production' && allowedOrigin === '*') {
    throw new BadRequestException('Wildcard CORS origin is not allowed in production.');
  }

  return config;
}
