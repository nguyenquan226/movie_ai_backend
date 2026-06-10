import { IsOptional, IsString } from 'class-validator';

export class CreateDirectorDto {
  @IsString()
  directorName: string;

  @IsOptional()
  @IsString()
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
}
