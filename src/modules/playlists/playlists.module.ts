import { Module } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Film } from '../films/entities/film.entity';
import { PlaylistFilm } from '../playlist-film/entities/playlist-film.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Playlist, Film, PlaylistFilm])],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
