import { Expose, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Validate,
  ValidateNested,
} from 'class-validator';
import { CreateFilmActorDto } from 'src/modules/film_actor/dto/create-film_actor.dto';
import { CreateFilmDirectorDto } from 'src/modules/film_director/dto/create-film_director.dto';
import { CreateFilmProducerDto } from 'src/modules/film_producer/dto/create-film_producer.dto';

export class CreateFilmImageDto {
  @Expose()
  @IsEnum(['poster', 'horizontal', 'backdrop'], {
    message: 'type must be one of: poster, horizontal, backdrop',
  })
  @IsNotEmpty({ message: 'imageType must not be empty' })
  type: 'poster' | 'horizontal' | 'backdrop';

  @Expose()
  @IsUrl({}, { message: 'url must be a valid URL' })
  @IsNotEmpty({ message: 'imageUrl must not be empty' })
  url: string;
}

export class CreateFilmDto {
  @Expose()
  @IsNotEmpty({ message: 'originalTitle must not be empty' })
  @IsString({ message: 'originalTitle must be STRING format' })
  originalTitle: string;

  @Expose()
  @IsNotEmpty({ message: 'title must not be empty' })
  @IsString({ message: 'title must be STRING format' })
  title: string;

  @Expose()
  @IsNotEmpty({ message: 'description must not be empty' })
  @IsString({ message: 'description must be STRING format' })
  description: string;

  @Expose()
  @IsOptional()
  @IsDate({ message: 'releaseDate must be DATE format' })
  @Type(() => Date)
  releaseDate?: Date;

  @Expose()
  @IsNotEmpty({ message: 'year must not be empty' })
  @IsString({ message: 'year must be STRING format' })
  year: string;

  @Expose()
  @IsOptional()
  @IsNumber({}, { message: 'duration must be Number format' })
  duration?: number;

  @Expose()
  @IsOptional()
  @IsBoolean({ message: 'duration must be Boolean format' })
  isVip?: boolean;

  @Expose()
  @IsNotEmpty({ message: 'thumbUrl must not be empty' })
  @IsString({ message: 'thumbUrl must be STRING format' })
  thumbUrl: string;

  @Expose()
  @IsNotEmpty({ message: 'slug must not be empty' })
  @IsString({ message: 'slug must be STRING format' })
  slug: string;

  @Expose()
  @IsNotEmpty({ message: 'ageCode must not be empty' })
  ageCode: string;

  @Expose()
  @IsNotEmpty({ message: 'typeCode must not be empty' })
  typeCode: string;

  @Expose()
  @IsArray({ message: 'genreCodes must be ARRAY format' })
  @ArrayNotEmpty({ message: 'genreCodes must not be empty' })
  @IsString({ each: true, message: 'genreCode must not be empty' })
  genreCodes: string[];

  @Expose()
  @IsArray({ message: 'filmImages must be ARRAY format' })
  @ValidateNested({ each: true })
  @Type(() => CreateFilmImageDto)
  filmImages: CreateFilmImageDto[];

  @Expose()
  @IsNotEmpty({ message: 'countryCode must not be empty' })
  countryCode: string;

  @Expose()
  @IsNotEmpty({ message: 'langCode must not be empty' })
  langCode: string;

  @Expose()
  @IsNotEmpty({ message: 'publicStatusCode must not be empty' })
  publicStatusCode: string;

  @Expose()
  @IsArray({ message: 'Directors must be ARRAY format' })
  @ValidateNested({ each: true })
  @Type(() => CreateFilmDirectorDto)
  directors: CreateFilmDirectorDto[];

  @Expose()
  @IsArray({ message: 'Actors must be ARRAY format' })
  @ValidateNested({ each: true })
  @Type(() => CreateFilmActorDto)
  actors: CreateFilmActorDto[];

  @Expose()
  @IsArray({ message: 'Producers must be ARRAY format' })
  @ValidateNested({ each: true })
  @Type(() => CreateFilmProducerDto)
  producers: CreateFilmProducerDto[];
}
