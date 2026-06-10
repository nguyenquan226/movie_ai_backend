import { Module } from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { DatabasesController } from './databases.controller';
import { AllCodesService } from 'src/modules/all-codes/all-codes.service';
import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DirectorService } from 'src/modules/directors/director.service';

import { Director } from 'src/modules/directors/entities/director.entity';
import { RolePermissionService } from 'src/modules/role_permission/role_permission.service';
import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { RolesService } from 'src/modules/roles/roles.service';
import { Role } from 'src/modules/roles/entities/role.entity';
import { SearchModule } from 'src/modules/search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AllCode, User, Permission, Director, RolePermission, Role]),
    SearchModule,
  ],
  controllers: [DatabasesController],
  providers: [
    DatabasesService,
    AllCodesService,
    UsersService,
    DirectorService,
    RolePermissionService,
    RolesService,
  ],
  exports: [AllCodesService, DatabasesService],
})
export class DatabasesModule {}
