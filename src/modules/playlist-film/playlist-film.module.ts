import { Module } from '@nestjs/common';
import { PlaylistFilmService } from './playlist-film.service';
import { PlaylistFilmController } from './playlist-film.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistFilm } from './entities/playlist-film.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlaylistFilm])],
  controllers: [PlaylistFilmController],
  providers: [PlaylistFilmService],
  exports: [PlaylistFilmService],
})
export class PlaylistFilmModule {}
