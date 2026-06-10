import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRolePermissionDto {
  @IsNumber()
  @IsNotEmpty({ message: 'roleId  must be not empty' })
  @Type(() => Number)
  roleId: number;

  @IsNumber()
  @IsNotEmpty({ message: 'permissionId  must be not empty' })
  @Type(() => Number)
  permissionId: number;
}
