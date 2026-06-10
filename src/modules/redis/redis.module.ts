import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          enableOfflineQueue: true,
        });

        redis.on('connect', () => {
          console.log('>> Redis connected');
        });

        redis.on('error', (err) => {
          console.error('>> Redis error:', err);
        });

        redis.on('ready', () => {
          console.log('>> Redis ready');
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
