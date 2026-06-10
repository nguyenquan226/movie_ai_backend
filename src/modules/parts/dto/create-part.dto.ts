import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePartDto {
  @IsOptional()
  @IsString({ message: 'title must be STRING format' })
  title: string;

  @IsOptional()
  @IsString({ message: 'description must be STRING format' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'partNumber must be NUMBER format' })
  partNumber?: number;

  @IsNotEmpty({ message: 'filmId must not be empty' })
  @IsUUID('4', { message: 'filmId must be UUID v4 format' })
  filmId: string;
}
