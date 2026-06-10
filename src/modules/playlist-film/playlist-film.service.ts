import { Injectable } from '@nestjs/common';
import { CreatePlaylistFilmDto } from './dto/create-playlist-film.dto';
import { UpdatePlaylistFilmDto } from './dto/update-playlist-film.dto';

@Injectable()
export class PlaylistFilmService {
  create(createPlaylistFilmDto: CreatePlaylistFilmDto) {
    return 'This action adds a new playlistFilm';
  }

  findAll() {
    return `This action returns all playlistFilm`;
  }

  findOne(id: number) {
    return `This action returns a #${id} playlistFilm`;
  }

  update(id: number, updatePlaylistFilmDto: UpdatePlaylistFilmDto) {
    return `This action updates a #${id} playlistFilm`;
  }

  remove(id: number) {
    return `This action removes a #${id} playlistFilm`;
  }
}
