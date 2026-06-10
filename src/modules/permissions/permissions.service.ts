import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IUser } from 'src/modules/users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { Repository } from 'typeorm';
import aqp from 'api-query-params';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}
  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const { name, apiPath, module, method } = createPermissionDto;
    const isPermissionExist = await this.permissionRepository.exists({
      where: { apiPath: apiPath, method: method },
    });

    if (isPermissionExist) {
      return {
        EC: 1,
        EM: `Permission with apiPath=${apiPath} , method=${method} is already exist`,
      };
    }

    const newPermission = this.permissionRepository.create({
      name,
      apiPath,
      module,
      method,
      createdBy: user.userId,
    });

    try {
      await this.permissionRepository.save(newPermission);
      return {
        EC: 1,
        EM: 'Create a permission successfully',
        permissionId: newPermission?.permissionId,
        createdAt: newPermission?.createdAt,
      };
    } catch (error: any) {
      console.error('Error in create permissions:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from create permission service`,
      });
    }
  }

  async findAll() {
    try {
      const permissions = await this.permissionRepository.find({});
      return {
        permissions,
        EC: 1,
        EM: 'Get all permissions success',
      };
    } catch (error: any) {
      console.error('Error in findAll permissions:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findAll permisson service',
      });
    }
  }

  async findOne(id: number) {
    try {
      const foundPermission = await this.permissionRepository.findOne({
        where: { permissionId: id },
        select: {
          permissionId: true,
          name: true,
          method: true,
          apiPath: true,
          module: true,
          createdBy: true,
        },
      });
      if (!foundPermission) {
        return {
          EC: 0,
          EM: 'Permission not found',
        };
      }

      return {
        EC: 1,
        EM: 'Find one permission success',
        ...foundPermission,
      };
    } catch (error: any) {
      console.error('Error in findOne permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne permission service',
      });
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto, user: IUser) {
    try {
      const updateResult = await this.permissionRepository.update(
        {
          permissionId: id,
        },
        {
          ...updatePermissionDto,
          updatedAt: new Date(),
          updatedBy: user.userId,
        },
      );

      if (updateResult.affected === 0) {
        return {
          EC: 0,
          EM: 'Permission not found',
        };
      }

      return {
        EC: 1,
        EM: 'Update permission success',
        permissionId: id,
      };
    } catch (error: any) {
      console.error('Error in update permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update permission service',
      });
    }
  }

  async remove(id: number, user: IUser) {
    try {
      const result = await this.permissionRepository.update(
        {
          permissionId: id,
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
          EM: 'Permission not found',
        };
      } else {
        return {
          EC: 1,
          EM: `permission is deleted`,
          permissionId: id,
        };
      }
    } catch (error: any) {
      console.error('Error in delete permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from delete permission service',
      });
    }
  }

  async getPermissionsWithPagination(currentPage: number, limit: number, qs: string) {
    try {
      const { filter, sort } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const offset = (+currentPage - 1) * +limit;
      const defaultLimit = +limit ? +limit : 10;
      const totalItems = (await this.permissionRepository.find(filter)).length;
      const totalPages = Math.ceil(totalItems / defaultLimit);
      const result = await this.permissionRepository.find({
        where: filter,
        skip: offset,
        take: defaultLimit,
        order: sort,
      });

      return {
        EC: 1,
        EM: 'Get permissions with pagination success',
        metaData: {
          current: currentPage,
          pageSize: limit,
          totalPages: totalPages,
          totalItems: totalItems,
        },
        users: result,
      };
    } catch (error) {
      console.error('Error in getPermissionsWithPagination permission:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getPermissionsWithPagination service',
      });
    }
  }
}
