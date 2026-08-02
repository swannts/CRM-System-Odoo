import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { rateLimit } from 'express-rate-limit';
import { configuration } from './config/configuration.js';
import { swaggerConfig } from './config/swagger.config.js';
import { requestIdMiddleware } from './common/middleware/index.js';

async function bootstrap() {
  const appConfig = configuration();
  const nodeEnv = appConfig.nodeEnv;
  if (nodeEnv === 'production' && !appConfig.allowedOrigin) {
    throw new Error('ALLOWED_ORIGIN must be set in production.');
  }
  if (nodeEnv === 'production' && appConfig.allowedOrigin === '*') {
    throw new Error('Wildcard CORS origin is not allowed in production.');
  }
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(requestIdMiddleware);

  const corsOrigin =
    nodeEnv === 'production'
      ? appConfig.allowedOrigin.split(',').map((item) => item.trim()).filter(Boolean)
      : appConfig.allowedOrigin;

  app.enableCors({
    origin: corsOrigin,
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix(appConfig.apiPrefix);

  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title)
    .setDescription(swaggerConfig.description)
    .setVersion(swaggerConfig.version)
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .addApiKey({ type: 'apiKey', name: 'x-org-id', in: 'header' }, 'x-org-id')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(appConfig.port, '0.0.0.0');
}
bootstrap();
