import { Module } from '@nestjs/common';
import { FilmActorService } from './film_actor.service';
import { FilmActorController } from './film_actor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from '../films/entities/film.entity';
import { FilmActor } from './entities/film_actor.entity';
import { Actor } from '../actor/entities/actor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FilmActor, Film, Actor])],
  controllers: [FilmActorController],
  providers: [FilmActorService],
  exports: [TypeOrmModule, FilmActorService],
})
export class FilmActorModule {}
