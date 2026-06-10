import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'roleName must be not Empty' })
  @IsString({ message: 'roleName must be string format' })
  roleName: string;

  @IsNotEmpty({ message: 'description must be not Empty' })
  @IsString({ message: 'description must be string format' })
  description: string;

  @IsNotEmpty({ message: 'isActive must be not Empty' })
  @IsBoolean({ message: 'isActive must be Boolean format' })
  @Type(() => Boolean)
  isActive: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}
