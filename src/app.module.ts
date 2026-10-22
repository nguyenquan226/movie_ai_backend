import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { StartupBannerService } from 'src/cores/startup-banner.service';
import { BullConfigService } from './config/bull.config';
import { RedisModule } from './modules/redis/redis.module';
import { WatchGateway } from './modules/films/socket/watch-gateway';
import { APP_MODULES } from './modules';
import { shouldRunMigrations, shouldSynchronize } from './database/typeorm.env';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: shouldSynchronize(
          configService.get<string>('NODE_ENV'),
          configService.get<string>('DB_SYNCHRONIZE'),
        ),
        migrationsRun: shouldRunMigrations(
          configService.get<string>('NODE_ENV'),
          configService.get<string>('DB_MIGRATIONS_RUN'),
        ),
        migrationsTransactionMode: 'each',
        migrations: [join(__dirname, 'database/migrations/*.{js,ts}')],
      }),
    }),

    BullModule.forRootAsync({
      imports: [RedisModule],
      useClass: BullConfigService,
    }),

    ...APP_MODULES,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    WatchGateway,
    StartupBannerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
