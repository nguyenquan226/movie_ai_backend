import { IsString, IsEmail, IsNotEmpty, MinLength, Length } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Email must be EMAIL format' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;

  @IsNotEmpty({ message: 'fullName must not be empty' })
  @IsString({ message: 'fullName must be STRING format' })
  @Length(3, 20, {
    message: 'fullName must be between 3 and 20 characters long',
  })
  fullName: string;

  // @IsNotEmpty({ message: 'age must not be empty' })
  // age: number;

  // @IsNotEmpty({ message: 'roleId must not be empty' })
  // roleId: number;

  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  // @IsNotEmpty({ message: 'phoneNumber must not be empty' })
  // @IsString({ message: 'phoneNumber must be STRING format' })
  // phoneNumber: string;

  // @IsNotEmpty({ message: 'genderCode must not be empty' })
  // @IsString({ message: 'genderCode must be STRING format' })
  // genderCode: string;
}
