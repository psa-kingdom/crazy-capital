import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { isOriginAllowed } from './common/utils/cors.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cookie parser for refresh tokens
  app.use(cookieParser());

  // Global prefix & versioning
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Strict Production-Grade CORS Configuration
  const configuredOrigins = configService.get<string[]>('corsOrigin', []);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or validated trusted origins
      if (isOriginAllowed(origin, configuredOrigins)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'x-api-key',
      'x-tenant-id',
      'x-branch-id',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400,
  });

  // Global Filter and Interceptor
  app.useGlobalFilters(new HttpExceptionFilter(configuredOrigins));
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Crazy Capital Operating Platform API')
    .setDescription(
      "REST API documentation for Crazy Capital — India's Business Operating System.\n\nAll protected endpoints require a Bearer JWT access token.",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Crazy Capital API Docs',
  });

  const port = configService.get<number>('port', 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Crazy Capital API running on port ${port} (prefix: /${apiPrefix})`);
  logger.log(`📚 Swagger documentation available at /api/docs`);
}

bootstrap();

