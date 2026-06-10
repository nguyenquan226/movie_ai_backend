import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCoWatchingDto {
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name: string;

  @IsUUID('all', { message: 'Film ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'Film ID is required.' })
  filmId: string;

  @IsNumber({}, { message: 'partNumber must be a number' })
  @IsNotEmpty({ message: 'partNumber is required' })
  partNumber: number;

  @IsNumber({}, { message: 'episodeNumber must be a number' })
  @IsNotEmpty({ message: 'episodeNumber is required' })
  episodeNumber: number;

  @IsString({ message: 'Thumbnail URL must be a string.' })
  @IsNotEmpty({ message: 'Thumbnail URL cannot be empty.' })
  thumbUrl: string;

  @IsNotEmpty({ message: 'isPrivate cannot be empty.' })
  @IsBoolean({ message: 'isPrivate must be a boolean value.' })
  isPrivate: boolean;

  @IsNotEmpty({ message: 'isLive cannot be empty.' })
  @IsBoolean({ message: 'isLive must be a boolean value.' })
  isLive: boolean;
}
