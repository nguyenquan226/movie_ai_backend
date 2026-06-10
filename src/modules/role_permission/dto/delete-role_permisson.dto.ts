import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteRolePermissionDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty({ message: 'roleId  must be not empty' })
  roleId: number;

  @IsNumber()
  @IsNotEmpty({ message: 'permissionId  must be not empty' })
  @Type(() => Number)
  permissionId: number;
}
