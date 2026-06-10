import { Module } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { RolePermissionController } from './role_permission.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from './entities/role_permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
})
export class RolePermissionModule {}
