import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateFilmProducerDto {
  @IsOptional()
  filmId?: string;

  @IsNotEmpty()
  producerId: number;

  @IsNotEmpty()
  @IsBoolean()
  isMain: boolean;
}
