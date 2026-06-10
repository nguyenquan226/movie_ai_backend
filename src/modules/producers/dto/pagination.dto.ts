import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number

  @IsOptional()
  @IsString()
  sort?: string

  @IsOptional()
  @IsString()
  filter?: string
}
