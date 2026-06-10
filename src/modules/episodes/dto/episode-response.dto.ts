import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class PartDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  partNumber: number;
}

@Exclude()
export class EpisodeFindOne {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  episodeNumber: number;

  @Expose()
  duration: number;

  @Expose()
  slug: string;

  @Expose()
  videoUrl: string;

  @Expose()
  thumbUrl: string;

  @Expose()
  partId: string;

  @Expose()
  @Type(() => PartDto)
  part: PartDto;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}
