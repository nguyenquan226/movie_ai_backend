import { Exclude, Expose, Type } from 'class-transformer';
import { Episode } from 'src/modules/episodes/entities/episode.entity';

@Exclude()
export class episodeDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  episodeNumber: number;

  @Expose()
  duration: number;

  @Expose()
  videoUrl: string;

  @Expose()
  thumbUrl: string;
}

@Exclude()
export class episodeDtoAdmin extends episodeDto {
  @Expose()
  slug: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}

@Exclude()
export class PartResponseUser {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  partNumber: number;

  @Expose()
  description: string;

  @Expose()
  filmId: string;

  @Expose()
  @Type(() => episodeDto)
  episodes: episodeDto[];
}

@Exclude()
export class PartResponseFindAllByFilmIdAdmin {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  partNumber: number;

  @Expose()
  description: string;

  @Expose()
  filmId: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}

@Exclude()
export class PartResponseFindAllByFilmId extends PartResponseFindAllByFilmIdAdmin {
  @Expose()
  @Type(() => episodeDto)
  episodes: Episode[];
}

@Exclude()
export class PartResponsePaginate {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  partNumber: number;

  @Expose()
  description: string;

  @Expose()
  filmId: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  @Type(() => episodeDtoAdmin)
  episodes: episodeDtoAdmin[];
}
