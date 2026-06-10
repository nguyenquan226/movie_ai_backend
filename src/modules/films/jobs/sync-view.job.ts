import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Film } from '../entities/film.entity';
import { Repository } from 'typeorm';
import { RedisService } from 'src/modules/redis/redis.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SyncViewsJob {
  private readonly logger = new Logger(SyncViewsJob.name);

  constructor(
    @InjectRepository(Film) private readonly filmRepository: Repository<Film>,
    private readonly redisService: RedisService,
  ) {}

  @Cron('*/2 * * * *')
  async syncPendingViews() {
    try {
      this.logger.debug('Starting sync pending views job...');

      const pattern = 'view:film:*:pending';
      const keys = await this.redisService.keys(pattern);

      if (keys.length === 0) {
        this.logger.debug('No pending views to sync');
        return;
      }

      const pipeline = this.redisService.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();
      if (!results) {
        this.logger.warn('Redis pipeline returned null');
        return;
      }

      const updates: Map<string, number> = new Map();

      keys.forEach((key, index) => {
        const value = results[index][1];
        const count = parseInt(value as string) || 0;

        if (count > 0) {
          const filmId = key.split(':')[2];
          updates.set(filmId, count);
        }
      });

      if (updates.size === 0) {
        this.logger.debug('No valid updates found');
        return;
      }

      await this.batchUpdateDatabase(updates);

      await this.redisService.delMultiple(...keys);

      const cacheKeys = Array.from(updates.keys()).map((filmId) => `view:film:${filmId}:count`);

      if (cacheKeys.length > 0) {
        await this.redisService.delMultiple(...cacheKeys);
      }

      const totalViews = Array.from(updates.values()).reduce((sum, count) => sum + count, 0);

      this.logger.log(`Synced ${updates.size} films, ${totalViews} views`);
    } catch (error) {
      this.logger.error('Sync job failed:', error.stack);
    }
  }

  private async batchUpdateDatabase(updates: Map<string, number>) {
    await this.filmRepository.manager.transaction(async (manager) => {
      for (const [filmId, count] of updates) {
        await manager.increment(Film, { filmId }, 'view', count);
      }
    });
  }

  async manualSync(): Promise<{
    synced: number;
    totalViews: number;
  }> {
    const pattern = 'view:film:*:pending';
    const keys = await this.redisService.keys(pattern);

    if (keys.length === 0) {
      return { synced: 0, totalViews: 0 };
    }

    const pipeline = this.redisService.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();

    if (!results) {
      this.logger.warn('Redis pipeline returned null for manual sync');
      return { synced: 0, totalViews: 0 };
    }

    const updates: Map<string, number> = new Map();

    keys.forEach((key, index) => {
      const value = results[index][1];
      const count = parseInt(value as string) || 0;
      if (count > 0) {
        const filmId = key.split(':')[2];
        updates.set(filmId, count);
      }
    });

    if (updates.size > 0) {
      await this.batchUpdateDatabase(updates);
      await this.redisService.delMultiple(...keys);

      const cacheKeys = Array.from(updates.keys()).map((filmId) => `view:film:${filmId}:count`);
      await this.redisService.delMultiple(...cacheKeys);
    }

    const totalViews = Array.from(updates.values()).reduce((sum, count) => sum + count, 0);

    return {
      synced: updates.size,
      totalViews,
    };
  }
}
