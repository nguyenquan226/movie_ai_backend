import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  roleName?: string;

  @IsString()
  description?: string;

  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}
