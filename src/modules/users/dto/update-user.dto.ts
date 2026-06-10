import { OmitType } from '@nestjs/mapped-types';
import { IsNotEmpty } from 'class-validator';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
export class UpdateUserDto extends OmitType(CreateUserDto, ['password', 'email'] as const) {
  @IsNotEmpty({ message: 'userId must not be empty' })
  userId: number;
}
