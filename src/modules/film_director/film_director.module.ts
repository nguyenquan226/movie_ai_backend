import { Module } from '@nestjs/common';
import { FilmDirectorService } from './film_director.service';
import { FilmDirectorController } from './film_director.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Director } from '../directors/entities/director.entity';
import { FilmDirector } from './entities/film_director.entity';
import { Film } from '../films/entities/film.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FilmDirector, Film, Director])],
  controllers: [FilmDirectorController],
  providers: [FilmDirectorService],
  exports: [TypeOrmModule, FilmDirectorService],
})
export class FilmDirectorModule {}
