import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { TransformInterceptor } from 'src/cores/transform.interceptor';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { StartupBannerService } from 'src/cores/startup-banner.service';
import { RequestIdMiddleware } from 'src/cores/request-id.middleware';
import { LoggingInterceptor } from 'src/cores/logging.interceptor';
import { HttpExceptionFilter } from 'src/cores/http-exception.filter';
import { AuthenticatedSocketIoAdapter } from 'src/cores/authenticated-socket.adapter';
import { TokenBlacklistService } from 'src/modules/auth/token-blacklist.service';
import { resolveCorsOrigins } from 'src/common/utils/cors.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<string>('APP_PORT');

  app.use(helmet());
  app.use(cookieParser());
  app.use((req, res, next) => new RequestIdMiddleware().use(req, res, next));

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(
      configService.get<string>('FRONTEND_URL'),
      configService.get<string>('CORS_ORIGINS'),
    ),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  app.useWebSocketAdapter(
    new AuthenticatedSocketIoAdapter(
      app,
      app.get(JwtService),
      configService,
      app.get(TokenBlacklistService),
    ),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', '2'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ChillFlix API')
    .setDescription('REST API for the ChillFlix streaming platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port || 3000, '0.0.0.0');

  const bannerService = app.get(StartupBannerService);
  await bannerService.printStartupInfo();
}
void bootstrap();
