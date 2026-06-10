import { IsString } from 'class-validator';

export class ToggleFavoriteDto {
  @IsString({ message: 'filmId must be STRING format' })
  filmId: string;
}
