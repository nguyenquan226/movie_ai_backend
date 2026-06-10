import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { DiscoveryModule, MetadataScanner, Reflector } from '@nestjs/core';
import { PermissionScannerService } from './permission-scanner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), DiscoveryModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionScannerService, MetadataScanner, Reflector],
})
export class PermissionsModule {}
