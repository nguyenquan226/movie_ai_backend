import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { Type } from "class-transformer";
export class PaginationFaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  // Cho phép truyền thêm query filter tùy ý
  [key: string]: any;
}
