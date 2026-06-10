import { Exclude, Expose, plainToInstance, Transform, Type } from 'class-transformer';

@Exclude()
export class AllCodeDto {
  @Expose()
  keyMap: string;

  @Expose()
  valueEn: string;

  @Expose()
  valueVi: string;

  @Expose()
  description?: string;
}

export class FilmImageDto {
  @Expose()
  url: string;

  @Expose()
  type: 'poster' | 'horizontal' | 'backdrop';
}

@Exclude()
export class FilmResponseDto {
  @Expose()
  filmId: string;

  @Expose()
  originalTitle: string;

  @Expose()
  title: string;

  @Expose()
  duration?: number;

  @Expose()
  ratingEverage: number;

  @Expose()
  description: string;

  @Expose()
  releaseDate: string;

  @Expose()
  isVip: boolean;

  @Expose()
  year: string;

  @Expose()
  thumbUrl: string;

  @Expose()
  posterUrl: string;

  @Expose()
  slug: string;

  @Expose()
  view: string;

  @Expose()
  @Type(() => FilmImageDto)
  filmImages: FilmImageDto[];

  @Expose()
  genreCodes: string[];

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
  @Type(() => AllCodeDto)
  age: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  type: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  country: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  language: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  publicStatus: AllCodeDto;

  @Expose()
  @Exclude({ toPlainOnly: true })
  filmGenres: any[];
}

@Exclude()
export class FilmPaginationDto {
  @Expose()
  filmId: string;

  @Expose()
  originalTitle: string;

  @Expose()
  duration?: number;

  @Expose()
  ratingEverage: number;

  @Expose()
  description: string;

  @Expose()
  isVip: boolean;

  @Expose()
  title: string;

  @Expose()
  year: string;

  @Expose()
  slug: string;

  @Expose()
  view: string;

  @Expose()
  @Type(() => AllCodeDto)
  age: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  language: AllCodeDto;

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
