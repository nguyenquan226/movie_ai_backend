import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';
import { ReassignRoleDto } from './dto/reassign-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @Permission('Create a role', 'ROLES')
  @ResponseMessage('Create a Role')
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @Permission('Get all roles', 'ROLES')
  @ResponseMessage('Get all roles')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permission('Get a role by ID', 'ROLES')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
  @ResponseMessage('Get a role by id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Get('get-by-id/:id')
  @Permission('Get role by ID for details', 'ROLES')
  GetById(@Param('id') id: string) {
    return this.rolesService.finOneById(+id);
  }

  @Patch(':id')
  @Permission('Update a role by ID', 'ROLES')
  @ResponseMessage('Update a role')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @User() user: IUser) {
    return this.rolesService.update(+id, updateRoleDto, user);
  }

  @Delete(':id')
  @Permission('Delete a role by ID', 'ROLES')
  @ResponseMessage('Delete a role')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.remove(+id, user);
  }

  @Get(':id/check-delete')
  @Permission('Check role before deletion', 'ROLES')
  @ResponseMessage('Check role before delete')
  checkBeforeDelete(@Param('id') id: string) {
    return this.rolesService.checkRoleBeforDelete(+id);
  }

  @Post(':id/reassign-and-delete')
  @Permission('Reassign users and delete role', 'ROLES')
  @ResponseMessage('Reassign users and delete role')
  reassignAndDelete(@Param('id') id: string, @Body() dto: ReassignRoleDto, @User() user: IUser) {
    return this.rolesService.reassignAndDelete(+id, dto, user);
  }

  @Patch(':id/restore')
  @Permission('Restore a deleted role', 'ROLES')
  @ResponseMessage('Restore a role')
  restore(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.restore(+id, user);
  }
}
