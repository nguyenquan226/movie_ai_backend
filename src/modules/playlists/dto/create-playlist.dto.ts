import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlaylistDto {
  @IsString({ message: 'playlistName must be String format' })
  @IsNotEmpty({ message: 'playlistName must be not empty' })
  playlistName: string;

  @IsOptional()
  @IsString()
  description?: string;
}
