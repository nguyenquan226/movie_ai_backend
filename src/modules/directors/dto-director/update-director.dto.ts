import { IsOptional, IsString } from 'class-validator';

export class UpdateDirectorDto {
  @IsOptional()
  @IsString()
  directorName: string;

  @IsOptional()
  birthDate?: Date;

  @IsOptional()
  @IsString()
  genderCode?: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  nationalityCode?: string;

  @IsOptional()
  updatedAt?: Date;
}
