import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFilmActorDto {
  @IsOptional()
  filmId?: string;

  @IsNotEmpty()
  actorId: number;

  @IsNotEmpty()
  @IsString()
  characterName: string;
}
