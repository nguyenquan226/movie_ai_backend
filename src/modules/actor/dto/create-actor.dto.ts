import { IsOptional, IsString } from 'class-validator';

export class CreateActorDto {
  @IsString()
  @IsOptional()
  actorId: string;

  @IsString()
  @IsOptional()
  actorName: string;

  @IsString()
  @IsOptional()
  genderCode?: string;

  @IsString()
  @IsOptional()
  birthDate?: Date;

  @IsString()
  @IsOptional()
  shortBio?: string;

  @IsString()
  @IsOptional()
  nationalityCode?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
