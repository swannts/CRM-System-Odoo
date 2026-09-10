import { requireIdentityContext } from '@mymanager/node-service-kit';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { createSwaggerConfig } from './config/swagger.config.js';

import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigin = configService.get<string>('app.allowedOrigin') || '*';

  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
  });

  app.use(rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { 
      success: false, 
      error: { 
        code: 'TOO_MANY_REQUESTS', 
        message: 'Too many requests, please try again later.' 
      } 
    }
  }));

  app.use((req: any, res: any, next: () => void) => {
    const path = req.path.replace(/\/$/, '');
    const publicRoute = (req.method === 'POST' && path === '/v1/appointments/public') ||
      (req.method === 'GET' && (path === '/v1/appointments/available-slots' || /^\/v1\/booking-types\/[^/]+$/.test(path)));
    if (!path.startsWith('/v1/') || publicRoute || req.method === 'OPTIONS') return next();
    return requireIdentityContext(req, res, () => {
      if (!['GET', 'HEAD'].includes(req.method) && !['org_owner', 'org_admin', 'org_manager', 'org_staff'].includes(req.identity.orgRole)) {
        return res.status(403).json({ message: 'Your role cannot change bookings.' });
      }
      req.headers['x-org-id'] = req.identity.orgId;
      next();
    });
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('app.port') || 7040;
  await app.listen(port, '0.0.0.0');
  console.log(`Booking Service is running on: http://localhost:${port}`);
}
bootstrap();
