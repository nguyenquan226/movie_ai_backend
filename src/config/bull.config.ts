import { SharedBullConfigurationFactory } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BullConfigService implements SharedBullConfigurationFactory {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  createSharedConfiguration() {
    return {
      createClient: (type: string) => {
        return this.redisClient.duplicate();
      },

      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };
  }
}
