import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  MinLength,
  Length,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email must be EMAIL format' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;

  @IsString({ message: 'fullName must be STRING format' })
  @Length(3, 20, {
    message: 'fullName must be between 3 and 20 characters long',
  })
  fullName: string;

  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsNotEmpty({ message: 'phoneNumber must not be empty' })
  @IsString({ message: 'phoneNumber must be STRING format' })
  phoneNumber: string;

  @IsOptional()
  @IsNotEmpty({ message: 'age must not be empty' })
  @IsNumber({}, { message: 'age must be number format' })
  age: number;

  @IsOptional()
  @IsString({ message: 'avatarUrl must be STRING format' })
  avatarUrl: string;

  @IsNotEmpty({ message: 'genderCode must not be empty' })
  @IsString({ message: 'genderCode must be STRING format' })
  genderCode: string;

  @IsNotEmpty({ message: 'roleId must not be empty' })
  @IsNumber({}, { message: 'roleId must be number format' })
  @Type(() => Number)
  roleId: number;

  @IsOptional()
  @IsNotEmpty({ message: 'isVip must not be empty' })
  @IsBoolean({ message: 'isVip must be BOOLEAN format' })
  @Type(() => Boolean)
  isVip: boolean;

  @IsOptional()
  @IsString({ message: 'statusCode must be STRING format' })
  statusCode: string;

  @IsOptional()
  @IsNotEmpty({ message: 'isDeleted must not be empty' })
  @IsBoolean({ message: 'isDeleted must be BOOLEAN format' })
  @Type(() => Boolean)
  isDeleted: boolean;
}
