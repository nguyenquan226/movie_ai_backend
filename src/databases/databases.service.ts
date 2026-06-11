import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { SubscriptionPlan } from 'src/modules/subscription-plans/entities/subscription-plan.entity';
import { UsersService } from 'src/modules/users/users.service';
import { loadSeedData } from './helpers/seed-data.loader';

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);
  constructor(
    @InjectRepository(AllCode)
    private allCodeRepository: Repository<AllCode>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private role_perm_Repository: Repository<RolePermission>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async onModuleInit() {
    // const shouldInit = this.configService.get<boolean>('SHOULD_INIT');
    const shouldInit = false;
    if (Boolean(shouldInit)) {
      console.log('should init if data row count = 0');
      const countCode = await this.allCodeRepository.count();
      const countUser = await this.userRepository.count();
      const countPermission = await this.permissionRepository.count();
      const count_role_perm = await this.role_perm_Repository.count();
      const countRole = await this.roleRepository.count();
      const countSubPlans = await this.subscriptionPlanRepository.count();

      if (countCode === 0) {
        const allcodes = loadSeedData<any[]>('allcodes.json');
        await this.allCodeRepository.insert(allcodes);
      }

      if (countRole === 0) {
        const roles = loadSeedData<any[]>('roles.json');
        await this.roleRepository.insert(roles);
      }

      if (countUser === 0) {
        const initPassword = this.configService.get<string>('INIT_PASSWORD') as string;
        const rawUsers = loadSeedData<any[]>('users.json');
        const users = rawUsers.map(u => ({
          ...u,
          password: this.userService.getHashPassword(initPassword || u.password || 'default123'),
        }));
        await this.userRepository.insert(users);
      }

      if (countPermission === 0) {
        const permissions = loadSeedData<any[]>('permissions.json');
        await this.permissionRepository.insert(permissions);
      }

      if (count_role_perm === 0) {
        const rolePermissions = loadSeedData<any[]>('role-permissions.json');
        await this.role_perm_Repository.insert(rolePermissions);
      }

      if (countSubPlans === 0) {
        const subPlans = loadSeedData<any[]>('subscription-plans.json');
        await this.subscriptionPlanRepository.insert(subPlans);
      }

      if (countCode > 0 && countUser > 0 && countPermission > 0) {
        this.logger.warn('>>> ALREADY INIT SAMPLE DATA...');
      }
    }
  }
}
