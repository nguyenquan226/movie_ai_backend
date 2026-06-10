import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEpisodeDto {
  // @IsNotEmpty({ message: 'episodeNumber must not be empty' })
  // @IsNumber({}, { message: 'episodeNumber must be NUMBER format' })
  // episodeNumber: number;

  // @IsNotEmpty({ message: 'title must not be empty' })
  @IsOptional()
  @IsString({ message: 'title must be STRING format' })
  title: string;

  @IsNotEmpty({ message: 'slug must not be empty' })
  @IsString({ message: 'slug must be STRING format' })
  slug: string;

  @IsNotEmpty({ message: 'duration must not be empty' })
  @IsNumber({}, { message: 'episodeNumber must be NUMBER format' })
  duration: number;

  @IsNotEmpty({ message: 'videoUrl must not be empty' })
  @IsString({ message: 'videoUrl must be STRING format' })
  videoUrl: string;

  @IsNotEmpty({ message: 'thumbUrl must not be empty' })
  @IsString({ message: 'thumbUrl must be STRING format' })
  thumbUrl: string;

  @IsNotEmpty({ message: 'partId must not be empty' })
  @IsUUID('4', { message: 'partId must be UUID v4 format' })
  partId: string;
}
