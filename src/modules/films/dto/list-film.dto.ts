import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AllCodeDto, FilmImageDto } from 'src/modules/films/dto/film-response.dto';

@Exclude()
export class ListFilm {
  @Expose()
  filmId: string;

  @Expose()
  originalTitle: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  year: string;

  @Expose()
  duration?: number;

  @Expose()
  view: number;

  @Expose()
  typeCode: string;

  @Expose()
  publicStatusCode: string;

  @Expose()
  @Type(() => AllCodeDto)
  age: AllCodeDto;

  @Expose()
  @Type(() => FilmImageDto)
  filmImages: FilmImageDto[];

  @Expose()
  @Transform(
    ({ obj }) => {
      if (!obj.filmGenres || !Array.isArray(obj.filmGenres)) {
        return [];
      }
      return obj.filmGenres.map((fg) => fg.genre).filter(Boolean);
    },
    { toClassOnly: true },
  )
  @Type(() => AllCodeDto)
  genres: AllCodeDto[];

  @Expose()
  @Exclude({ toPlainOnly: true })
  filmGenres: any[];
}
