import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/modules/redis/redis.service';

@Injectable()
export class TokenBlacklistService {
  constructor(private readonly redisService: RedisService) {}

  private key(token: string): string {
    return `auth:blacklist:${token}`;
  }

  async add(token: string, ttlSeconds: number): Promise<void> {
    if (!token || ttlSeconds <= 0) {
      return;
    }
    await this.redisService.set(this.key(token), '1', ttlSeconds);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }
    return this.redisService.exists(this.key(token));
  }
}
