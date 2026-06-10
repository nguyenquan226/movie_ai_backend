import { PartialType } from '@nestjs/mapped-types';
import { CreateFilmDto } from './create-film.dto';
import { Type } from 'class-transformer';
import { UpdateFilmDirectorDto } from 'src/modules/film_director/dto/update-film_director.dto';
import { UpdateFilmActorDto } from 'src/modules/film_actor/dto/update-film_actor.dto';
import { UpdateFilmProducerDto } from "src/modules/film_producer/dto/update-film_producer.dto"

export class UpdateFilmDto extends PartialType(CreateFilmDto) {
  @Type(() => UpdateFilmDirectorDto)
  directors: UpdateFilmDirectorDto[];

  @Type(() => UpdateFilmActorDto)
  actors: UpdateFilmActorDto[];

  @Type(() => UpdateFilmProducerDto)
  producers: UpdateFilmProducerDto[]
}
