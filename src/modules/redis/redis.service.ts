import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis error: ', err);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error setting JSON for key ${key}:`, error);
      throw error;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting JSON for key ${key}:`, error);
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.redis.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} in ${key}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from ${key}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields from ${key}:`, error);
      throw error;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.redis.hdel(key, ...fields);
    } catch (error) {
      this.logger.error(`Error deleting hash fields from ${key}:`, error);
      throw error;
    }
  }

  async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.warn('Redis database flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    try {
      return await this.redis.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} by ${increment}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Error scanning keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  async delMultiple(...keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting multiple keys:`, error);
      throw error;
    }
  }

  pipeline() {
    return this.redis.pipeline();
  }

  multi() {
    return this.redis.multi();
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.lpush(key, ...values);
    } catch (error) {
      this.logger.error(`Error lpush to key ${key}:`, error);
      throw error;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.rpush(key, ...values);
    } catch (error) {
      this.logger.error(`Error rpush to key ${key}:`, error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error lrange from key ${key}:`, error);
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.redis.llen(key);
    } catch (error) {
      this.logger.error(`Error getting length of list ${key}:`, error);
      throw error;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Error sadd to key ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Error getting members from set ${key}:`, error);
      throw error;
    }
  }

  async scard(key: string): Promise<number> {
    try {
      return await this.redis.scard(key);
    } catch (error) {
      this.logger.error(`Error getting cardinality of set ${key}:`, error);
      throw error;
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error);
      throw error;
    }
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.redis.mget(...keys);
    } catch (error) {
      this.logger.error(`Error getting multiple keys:`, error);
      throw error;
    }
  }

  async mset(keyValues: Record<string, string>): Promise<string> {
    try {
      const args: string[] = [];
      for (const [key, value] of Object.entries(keyValues)) {
        args.push(key, value);
      }
      return await this.redis.mset(...args);
    } catch (error) {
      this.logger.error(`Error setting multiple keys:`, error);
      throw error;
    }
  }
}
