import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateRatingDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingValue?: number;

  @IsOptional()
  content?: string;
}
