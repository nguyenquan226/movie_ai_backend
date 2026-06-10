import { IsNotEmpty, IsString } from 'class-validator';

export class AddFilmToPlaylistDto {
  @IsString({ message: 'filmId must be String format' })
  @IsNotEmpty({ message: 'filmId must be not empty' })
  filmId: string;

  @IsString({ message: 'playlistId must be String format' })
  @IsNotEmpty({ message: 'playlistId must be not empty' })
  playlistId: string;
}
