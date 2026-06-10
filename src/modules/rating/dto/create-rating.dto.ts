import { IsUUID, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRatingDto {
  @IsUUID()
  @IsNotEmpty()
  filmId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  ratingValue: number;

  @IsOptional()
  content?: string;
}
