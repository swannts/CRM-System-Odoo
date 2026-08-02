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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('app.port') || 7040;
  await app.listen(port, '0.0.0.0');
  console.log(`Booking Service is running on: http://localhost:${port}`);
}
bootstrap();
