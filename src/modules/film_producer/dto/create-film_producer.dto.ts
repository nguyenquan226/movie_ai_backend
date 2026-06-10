import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator"

export class CreateFilmProducerDto {
  @IsOptional()
  filmId?: string

  @IsNotEmpty()
  producerId: number

  @IsNotEmpty()
  @IsBoolean()
  isMain: boolean
}
