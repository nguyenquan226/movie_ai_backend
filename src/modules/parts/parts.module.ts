import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from './entities/part.entity';
import { Film } from '../films/entities/film.entity';
import { EpisodesModule } from '../episodes/episodes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Part, Film]), EpisodesModule],
  controllers: [PartsController],
  providers: [PartsService],
  exports: [PartsService],
})
export class PartsModule {}
