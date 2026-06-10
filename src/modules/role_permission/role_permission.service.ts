import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRolePermissionDto } from './dto/create-role_permission.dto';
import { IUser } from '../users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from './entities/role_permission.entity';
import { Repository } from 'typeorm';
import { DeleteRolePermissionDto } from './dto/delete-role_permisson.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private RolePermissionRepository: Repository<RolePermission>,
  ) {}
  async create(createRolePermissionDto: CreateRolePermissionDto, user: IUser) {
    try {
      const isExist = await this.RolePermissionRepository.exists({
        where: {
          roleId: createRolePermissionDto.roleId,
          permissionId: createRolePermissionDto.permissionId,
        },
      });

      if (isExist) {
        return {
          EC: 0,
          EM: 'Role-Permission is already exist',
        };
      } else {
        const rolePermission = this.RolePermissionRepository.create({
          ...createRolePermissionDto,
          createdBy: user.userId,
          isDeleted: false,
        });

        await this.RolePermissionRepository.save(rolePermission);

        return {
          EC: 1,
          EM: 'Role-Permission created successfully',
          rolePermissionId: rolePermission.rolePermissionId,
          createdAt: rolePermission.createdAt,
        };
      }
    } catch (error: any) {
      console.error('Error in create role-permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from create role-permission service`,
      });
    }
  }

  async remove(deleteRolePermissionDto: DeleteRolePermissionDto, user: IUser) {
    try {
      const foundRolePermission = await this.RolePermissionRepository.findOne({
        where: {
          permissionId: deleteRolePermissionDto.permissionId,
          roleId: deleteRolePermissionDto.roleId,
        },
      });

      if (!foundRolePermission) {
        return {
          EC: 0,
          EM: 'Role-Permisson not found',
        };
      }

      foundRolePermission.isDeleted = true;
      foundRolePermission.deletedBy = user.userId;
      foundRolePermission.deletedAt = new Date();

      await this.RolePermissionRepository.save(foundRolePermission);

      return {
        EC: 1,
        EM: 'Deleted successfully',
      };
    } catch (error: any) {
      console.error('Error in Delete role-permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from Delete role-permission service`,
      });
    }
  }

  async getPermissionsByRole(roleId: number) {
    try {
      const result = await this.RolePermissionRepository.find({
        where: { roleId: roleId, isDeleted: false },
      });
      return {
        EC: 1,
        EM: 'Get all permissinon by role successfully',
        permissions: result,
      };
    } catch (error: any) {
      console.error('Error in Get all permissinon by role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from Get all permissinon by role service`,
      });
    }
  }

  async getRolebyPermission(permissionId: number) {
    try {
      const result = await this.RolePermissionRepository.find({
        where: { permissionId: permissionId, isDeleted: false },
      });
      return {
        EC: 1,
        EM: 'Get all role by permission successfully',
        roles: result,
      };
    } catch (error: any) {
      console.error('Error in Get all role by permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from Get all role by permission service`,
      });
    }
  }
}
