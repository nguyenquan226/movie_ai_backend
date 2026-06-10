import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class Film {
  @Expose()
  originalTitle: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;
}

@Exclude()
export class Host {
  @Expose()
  fullName: string;

  @Expose()
  avatarUrl: string;
}

@Exclude()
export class CoWatchingRes {
  @Expose()
  roomId: string;

  @Expose()
  name: string;

  @Expose()
  hostId: number;

  @Expose()
  @Type(() => Host)
  host: Host;

  @Expose()
  filmId: string;

  @Expose()
  partNumber: number;

  @Expose()
  episodeNumber: number;

  @Expose()
  thumbUrl: string;

  @Expose()
  isLive: boolean;

  @Expose()
  isPrivate: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  duration: number;
}

@Exclude()
export class RoomPaginate extends CoWatchingRes {
  @Expose()
  @Type(() => Film)
  film: Film;
}
