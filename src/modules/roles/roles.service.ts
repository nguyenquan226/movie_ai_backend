import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IUser } from '../users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { joinWithCommonFields } from 'src/common/utils/join-allcode';
import { plainToInstance } from 'class-transformer';
import { RoleResponseDto } from './dto/role-response.dto';
import { RolePermission } from '../role_permission/entities/role_permission.entity';
import { User } from '../users/entities/user.entity';
import { ReassignRoleDto } from './dto/reassign-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async create(createRoleDto: CreateRoleDto, user: IUser) {
    try {
      const { roleName, description, isActive, permissionIds } = createRoleDto;

      const isExist = await this.roleRepository.exists({
        where: { roleName: roleName },
      });

      if (isExist) {
        return {
          EC: 2,
          EM: `Role ${roleName} is already exist`,
        };
      } else {
        //tạo role
        const newRole = await this.roleRepository.save({
          roleName,
          description,
          isActive,
          createdBy: user.userId,
        });

        //tạo role_permission

        if (permissionIds?.length > 0) {
          const records = permissionIds.map((perId) => ({
            roleId: newRole.roleId,
            permissionId: perId,
            createdBy: user.userId,
          }));

          await this.rolePermissionRepository.save(records);
        }

        return {
          EC: 1,
          EM: 'Create new role success',
          roleId: newRole?.roleId,
          createdAt: newRole?.createdAt,
        };
      }
    } catch (error: any) {
      console.error('Error in create role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from create role service`,
      });
    }
  }

  async findAll() {
    try {
      const result = await this.roleRepository.find({
        select: {
          roleId: true,
          roleName: true,
          description: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (result) {
        return {
          EC: 1,
          EM: 'Get all roles success',
          roles: result,
        };
      }
    } catch (error) {
      console.error('Error in findAll Roles:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findAll Roles service',
      });
    }
  }

  async findOne(id: number) {
    try {
      const isExist = await this.roleRepository.exists({
        where: { roleId: id, isDeleted: false, isActive: true },
      });
      if (!isExist) {
        return {
          EC: 0,
          EM: 'Role not found',
        };
      }

      const queryBuilder = this.roleRepository.createQueryBuilder('role');
      queryBuilder.leftJoinAndSelect(
        'role.rolePermission',
        'rolePermission',
        'rolePermission.isDeleted = false AND rolePermission.roleId = role.roleId',
      );
      joinWithCommonFields(queryBuilder, 'rolePermission.permission', 'permission');

      const role = await queryBuilder.where('role.roleId = :roleId', { roleId: id }).getOne();
      const data = plainToInstance(RoleResponseDto, role);
      return {
        EC: 1,
        EM: 'Find a role success',
        role: data,
      };
    } catch (error: any) {
      console.error('Error in findOne role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne role service',
      });
    }
  }

  async finOneById(id: number) {
    try {
      const role = await this.roleRepository.findOne({
        where: { roleId: id, isDeleted: false },
        relations: {
          rolePermission: true,
        },
        select: {
          roleId: true,
          roleName: true,
          description: true,
          isActive: true,
          rolePermission: true,
        },
      });

      if (!role) {
        return {
          EC: 0,
          EM: 'Role not found',
        };
      }

      return {
        EC: 1,
        EM: 'Find a role success',
        ...role,
      };
    } catch (error: any) {
      console.error('Error in findOne role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne role service',
      });
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, user: IUser) {
    try {
      const { permissionIds, ...roleFields } = updateRoleDto;
      await this.roleRepository.update(
        {
          roleId: id,
        },
        {
          ...roleFields,
          updatedAt: new Date(),
          updatedBy: user.userId,
          roleId: id,
        },
      );

      // Nếu không cập nhật permission
      if (!permissionIds) {
        return { EC: 1, EM: 'Update role success', roleId: id };
      }

      // Lấy permission cũ
      const oldRolePermission_Record = await this.rolePermissionRepository.find({
        where: { roleId: id },
      });

      const oldIds = oldRolePermission_Record.map((rp) => rp.permissionId);

      // Xác định cần thêm và cần xoá, t mệt vl
      const idToAdds = permissionIds.filter((pid) => !oldIds.includes(pid));
      // console.log('check to add: ', idToAdds);

      const idToRemoves = oldIds.filter((pid) => !permissionIds.includes(pid));
      // console.log('check to toRemove: ', idToRemoves);

      // Thêm mới
      if (idToAdds.length > 0) {
        await this.rolePermissionRepository.save(
          idToAdds.map((pid) => ({
            roleId: id,
            permissionId: pid,
            createdBy: user.userId,
          })),
        );
      }

      if (idToRemoves.length > 0) {
        await this.rolePermissionRepository.delete({
          roleId: id,
          permissionId: In(idToRemoves),
        });
      }

      return {
        EC: 1,
        EM: 'Update Role success',
        roleId: id,
      };
    } catch (error: any) {
      console.error('Error in update Role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update Role service',
      });
    }
  }

  async checkRoleBeforDelete(roleId: number) {
    try {
      const role = await this.roleRepository.findOne({
        where: { roleId: roleId, isDeleted: false },
      });

      if (!role) {
        return {
          EC: 0,
          EM: 'Role not found',
        };
      }

      //current user in role
      const userInRoleCount = await this.userRepository.count({
        where: { roleId: roleId, isDeleted: false },
      });

      //alternative roles : !== roleId, isDeleted: false, isActive: true
      const alternativeRoles = await this.roleRepository.find({
        where: { roleId: Not(roleId), isDeleted: false, isActive: true },
        select: {
          roleId: true,
          roleName: true,
        },
      });

      return {
        EC: 1,
        EM: 'Check role before delete success',
        userCount: userInRoleCount,
        alternativeRoles,
      };
    } catch (error) {
      console.error('Error in checkBeforeDelete role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from checkBeforeDelete role service',
      });
    }
  }

  // all users have roleId ==> targetRoleId, soft delete role + (optional) soft delete role_permission
  async reassignAndDelete(roleId: number, dto: ReassignRoleDto, user: IUser) {
    const { targetRoleId } = dto;
    try {
      if (roleId === targetRoleId) {
        return {
          EC: 0,
          EM: 'Target role must be different from current role',
        };
      }

      const [role, targetRole] = await Promise.all([
        this.roleRepository.findOne({
          where: { roleId: roleId, isDeleted: false },
        }),
        this.roleRepository.findOne({
          where: { roleId: targetRoleId, isActive: true, isDeleted: false },
        }),
      ]);

      if (!role) {
        return {
          EC: 0,
          EM: 'Role not found',
        };
      }

      if (!targetRole) {
        return {
          EC: 0,
          EM: 'Target role not found or inactive',
        };
      }

      await this.roleRepository.manager.transaction(async (manager) => {
        await manager.update(
          User,
          { roleId: roleId, isDeleted: false },
          {
            roleId: targetRoleId,
            updatedAt: new Date(),
            updatedBy: user.userId,
          },
        );

        await manager.update(
          Role,
          { roleId: roleId },
          {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: user.userId,
          },
        );

        await manager.update(
          RolePermission,
          { roleId: roleId },
          {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: user.userId,
          },
        );
      });

      return {
        EC: 1,
        EM: 'Reassign users and delete role success',
        roleId: roleId,
        targetRoleId,
      };
    } catch (error) {
      console.error('Error in reassignAndDelete Role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from reassignAndDelete Role service',
      });
    }
  }

  async remove(id: number, user: IUser) {
    try {
      const userCount = await this.userRepository.count({
        where: { roleId: id, isDeleted: false },
      });

      if (userCount > 0) {
        return {
          EC: 2,
          EM: 'Role is being used by users, need reassignment',
          data: { userCount },
        };
      }
      const result = await this.roleRepository.update(
        {
          roleId: id,
        },
        {
          deletedAt: new Date(),
          isDeleted: true,
          deletedBy: user.userId,
        },
      );

      if (result.affected === 0) {
        return {
          EC: 0,
          EM: 'Role not found',
        };
      } else {
        return {
          EC: 1,
          EM: `Role is deleted`,
        };
      }
    } catch (error: any) {
      console.error('Error in delete Role:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from delete Role service',
      });
    }
  }

  async restore(id: number, user: IUser) {
    try {
      const deletedRole = await this.roleRepository.findOne({
        where: { roleId: id, isDeleted: true },
        relations: {
          rolePermission: true,
        },
        select: {
          roleId: true,
          roleName: true,
          description: true,
          isActive: true,
          isDeleted: true,
          rolePermission: true,
        },
      });

      if (!deletedRole) {
        return {
          EC: 0,
          EM: 'Role not found or not deleted',
        };
      }

      await this.roleRepository.manager.transaction(async (manager) => {
        await manager.update(
          Role,
          { roleId: id },
          {
            isDeleted: false,
            deletedAt: null as any,
            deletedBy: null as any,
            updatedAt: new Date(),
            updatedBy: user.userId,
          },
        );

        await manager.update(
          RolePermission,
          { roleId: id, isDeleted: true },
          {
            isDeleted: false,
            deletedAt: null as any,
            deletedBy: null as any,
            updatedAt: new Date(),
            updatedBy: user.userId,
          },
        );
      });

      return {
        EC: 1,
        EM: 'Restore role success',
        roleId: id,
        roleName: deletedRole.roleName,
      };
    } catch (error) {
      console.error('Error in restore Role:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from restore Role service',
      });
    }
  }
}
