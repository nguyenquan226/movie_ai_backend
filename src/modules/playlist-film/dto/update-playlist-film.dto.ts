import { PartialType } from '@nestjs/mapped-types';
import { CreatePlaylistFilmDto } from './create-playlist-film.dto';

export class UpdatePlaylistFilmDto extends PartialType(CreatePlaylistFilmDto) {}
