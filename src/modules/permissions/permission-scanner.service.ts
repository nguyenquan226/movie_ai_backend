import { Injectable, OnModuleInit, RequestMethod } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity';
import { PERMISSION_METADATA } from 'src/decorators/permission.decorator';

@Injectable()
export class PermissionScannerService implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async onModuleInit() {
    console.log('Finding new permissions...');

    const controllers = this.discovery.getControllers();

    for (const wrapper of controllers) {
      const instance = wrapper.instance;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);

      //duyệt qua tất cả method trong controller
      this.metadataScanner.scanFromPrototype(instance, prototype, (methodName: string) => {
        const methodRef = prototype[methodName]; // tham chieeus đến method
        const meta = this.reflector.get(PERMISSION_METADATA, methodRef); // đọc metadata

        if (!meta) return;

        const apiPath = this.getFullApiPath(wrapper, methodRef);

        // Lấy HTTP method từ metadata path decorator
        const methodMetadata = Reflect.getMetadata('method', methodRef);
        let httpMethod = 'GET'; // default

        // NestJS lưu HTTP method dưới dạng RequestMethod enum
        if (typeof methodMetadata === 'number') {
          const methodMap = {
            [RequestMethod.GET]: 'GET',
            [RequestMethod.POST]: 'POST',
            [RequestMethod.PUT]: 'PUT',
            [RequestMethod.DELETE]: 'DELETE',
            [RequestMethod.PATCH]: 'PATCH',
            [RequestMethod.OPTIONS]: 'OPTIONS',
            [RequestMethod.HEAD]: 'HEAD',
            [RequestMethod.ALL]: 'ALL',
          };
          httpMethod = methodMap[methodMetadata] || 'GET';
        }

        this.insertIfNotExists(meta.name, apiPath, httpMethod.toUpperCase(), meta.module);
      });
    }
  }

  private async insertIfNotExists(name: string, apiPath: string, method: string, module: string) {
    const exist = await this.permissionRepo.findOne({
      where: { apiPath, method },
    });

    if (exist) return;

    await this.permissionRepo.save({
      name,
      apiPath,
      method,
      module,
    });

    console.log(`Created new permission: [${method}] ${apiPath} (${module}.${name})`);
  }

  private getFullApiPath(controller: any, methodRef: any): string {
    const ctrlPath = Reflect.getMetadata('path', controller.metatype) || '';
    const handlerPath = Reflect.getMetadata('path', methodRef) || '';

    let version =
      Reflect.getMetadata('version', methodRef) ||
      Reflect.getMetadata('version', controller.metatype) ||
      '1';

    if (Array.isArray(version)) {
      version = version[0];
    }

    const versionPrefix = `/api/v${version}`;

    return `${versionPrefix}/${ctrlPath}/${handlerPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
  }
}
