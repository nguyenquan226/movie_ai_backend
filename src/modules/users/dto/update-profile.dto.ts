import { Type } from 'class-transformer';
import { IsNumber, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsString({ message: 'fullName must be STRING format' })
  @Length(3, 20, {
    message: 'fullName must be between 3 and 20 characters long',
  })
  fullName: string;

  @IsString({ message: 'avatarUrl must be STRING format' })
  avatarUrl: string;

  @IsString({ message: 'genderCode must be STRING format' })
  genderCode: string;
}
