import { forwardRef, Module } from '@nestjs/common';
import { CoWatchingService } from './co-watching.service';
import { CoWatchingController } from './co-watching.controller';
import { RedisModule } from '../redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomCoWatching } from './entities/co-watching.entity';
import { FilmsModule } from '../films/films.module';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([RoomCoWatching]), forwardRef(() => FilmsModule)],
  controllers: [CoWatchingController],
  providers: [CoWatchingService],
  exports: [CoWatchingService],
})
export class CoWatchingModule {}
