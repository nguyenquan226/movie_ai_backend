import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateFilmDirectorDto {
  @IsOptional()
  filmId?: string;

  @IsNotEmpty()
  directorId: number;

  @IsNotEmpty()
  @IsBoolean()
  isMain: boolean;
}
