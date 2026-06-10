import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { CreateRolePermissionDto } from './dto/create-role_permission.dto';
import { ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';
import { DeleteRolePermissionDto } from './dto/delete-role_permisson.dto';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('role-permission')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) { }

  @Post()
  @Permission('Create role-permission relation', 'ROLE_PERMISSION')
  @SkipCheckPermission()
  create(@Body() createRolePermissionDto: CreateRolePermissionDto, @User() user: IUser) {
    return this.rolePermissionService.create(createRolePermissionDto, user);
  }

  @Delete('/delete')
  @Permission('Delete role-permission relation', 'ROLE_PERMISSION')
  @SkipCheckPermission()
  remove(@Body() deleteRolePermissionDto: DeleteRolePermissionDto, @User() user: IUser) {
    return this.rolePermissionService.remove(deleteRolePermissionDto, user);
  }

  @Get('by-role/:roleId')
  @Permission('Get all role-permission relations by role', 'ROLE_PERMISSION')
  @SkipCheckPermission()
  gerPermissionByRole(@Param('roleId') roleId: string) {
    return this.rolePermissionService.getPermissionsByRole(+roleId);
  }

  @Get('by-permission/:permissionId')
  @Permission('Get all role-permission relations by permission', 'ROLE_PERMISSION')
  @SkipCheckPermission()
  gerRoleByPermission(@Param('permissionId') permissionId: string) {
    return this.rolePermissionService.getRolebyPermission(+permissionId);
  }
}
