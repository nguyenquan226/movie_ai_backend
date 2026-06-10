import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { isArray } from 'class-validator';
import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Exclude()
export class PermissionDTO {
  @Expose()
  name: string;

  @Expose()
  apiPath: string;

  @Expose()
  method: string;

  @Expose()
  module: string;
}

@Exclude()
export class RoleResponseDto {
  @Expose()
  roleId: number;

  @Expose()
  roleName: string;

  @Expose()
  description: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isDeleted: boolean;

  @Expose()
  createdBy: number;

  @Expose()
  updatedBy: number;

  @Expose()
  deletedBy: number;

  @Expose()
  users: User[];

  @Expose()
  @Exclude({ toPlainOnly: true })
  rolePermission: RolePermission[];

  @Expose()
  @Transform(
    ({ obj }) => {
      if (!obj.rolePermission || !isArray(obj.rolePermission)) {
        return [];
      } else {
        return obj.rolePermission.map((rp) => rp.permission).filter(Boolean);
      }
    },
    { toClassOnly: true },
  )
  @Type(() => PermissionDTO)
  permissons: PermissionDTO[];
}
