import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFilmActorDto {
  @IsOptional()
  filmId?: string;

  @IsNotEmpty()
  actorId: number;

  @IsNotEmpty()
  @IsString()
  characterName: string;
}
