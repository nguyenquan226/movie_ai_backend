import { Exclude, Expose, Type } from 'class-transformer';
import { AllCodeDto } from './film-response.dto';

@Exclude()
class User {
  @Expose()
  userId: string;

  @Expose()
  fullName: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  avatarUrl: string;

  @Expose()
  email: string;
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
  title: string;

  @Expose()
  slug: string;

  @Expose()
  view: string;

  @Expose()
  isVip: boolean;

  @Expose()
  @Type(() => AllCodeDto)
  language: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  publicStatus: AllCodeDto;

  @Expose()
  @Type(() => AllCodeDto)
  country: AllCodeDto;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  @Type(() => User)
  createdBy: User;

  @Expose()
  @Type(() => User)
  updatedBy: User;
}

@Exclude()
export class FilmDeletedPaginationDto extends FilmPaginationDto {
  @Expose()
  deletedAt: string;

  @Expose()
  @Type(() => User)
  deletedBy: User;
}
