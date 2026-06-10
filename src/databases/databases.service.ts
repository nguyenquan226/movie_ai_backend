import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ADMIN_ROLE,
  GENDER_Female,
  GENDER_Male,
  GENDER_Other,
  USER_ROLE,
} from 'src/constants/allcode.constant';
import { INIT_ALLCODE } from 'src/databases/sampleData/sample.allcode';
import { INIT_PERMISSIONS } from 'src/databases/sampleData/sample.permission';
import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';

import { Repository } from 'typeorm';
import { INIT_ROLE_PERMISSION } from './sampleData/role_permission';
import { Role } from 'src/modules/roles/entities/role.entity';

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

      if (countCode === 0) {
        await this.allCodeRepository.insert(INIT_ALLCODE);
      }

      if (countRole === 0) {
        await this.roleRepository.insert([
          {
            roleId: 2,
            roleName: 'ROLE_ADMIN',
            description: 'admin full quyền',
            isActive: true,
            createdBy: 15,
          },
          {
            roleId: 4,
            roleName: 'ROLE_MOD',
            description: 'Người kiểm duyệt',
            createdBy: 15,
          },
          {
            roleId: 5,
            roleName: 'ROLE_USER',
            description: 'Người dùng',
            isActive: true,
            isDeleted: false,
            createdBy: 15,
          },
          {
            roleId: 6,
            roleName: 'tesst',
            description: 'Người dùng',
            isActive: true,
            createdBy: 15,
          },
        ]);
      }

      if (countUser === 0) {
        const initPassword = this.configService.get<string>('INIT_PASSWORD') as string;
        await this.userRepository.insert([
          {
            email: 'admin@gmail.com',
            fullName: 'admin',
            age: 30,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0768894134',
            genderCode: GENDER_Male,
            roleId: ADMIN_ROLE,
            isVip: true,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user@gmail.com',
            fullName: 'Normal user',
            age: 28,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0768894134',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user2@gmail.com',
            fullName: 'Trần Mai',
            age: 28,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0768894134',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user3@gmail.com',
            fullName: 'Phạm Quốc D',
            age: 26,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0717433007',
            genderCode: GENDER_Other,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user4@gmail.com',
            fullName: 'Nguyễn Hữu Tài',
            age: 25,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0791123456',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user5@gmail.com',
            fullName: 'Lê Thị Bích Ngọc',
            age: 23,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0789900112',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user6@gmail.com',
            fullName: 'Phan Trung Kiên',
            age: 27,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0774589213',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user7@gmail.com',
            fullName: 'Võ Hồng Nhung',
            age: 24,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0799988123',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user8@gmail.com',
            fullName: 'Trương Quang Minh',
            age: 31,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0762331445',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user9@gmail.com',
            fullName: 'Đoàn Thị Lan',
            age: 22,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0703124448',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user10@gmail.com',
            fullName: 'Ngô Đức Phát',
            age: 26,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0714567890',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user11@gmail.com',
            fullName: 'Phạm Thảo My',
            age: 20,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0793456789',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user12@gmail.com',
            fullName: 'Nguyễn Văn Long',
            age: 28,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0755432211',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user13@gmail.com',
            fullName: 'Lê Quỳnh Anh',
            age: 29,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0791123499',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user14@gmail.com',
            fullName: 'Huỳnh Quốc Huy',
            age: 27,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0745567899',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user15@gmail.com',
            fullName: 'Đặng Ngọc Bích',
            age: 25,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0787654321',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user16@gmail.com',
            fullName: 'Bùi Thanh Tùng',
            age: 30,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0719988776',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user17@gmail.com',
            fullName: 'Ngô Thị Kim Yến',
            age: 24,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0708877665',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user18@gmail.com',
            fullName: 'Vũ Minh Trí',
            age: 32,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0795647382',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user19@gmail.com',
            fullName: 'Trần Thu Hà',
            age: 21,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0756677889',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user20@gmail.com',
            fullName: 'Phạm Tuấn Kiệt',
            age: 26,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0714321555',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user21@gmail.com',
            fullName: 'Nguyễn Hồng Ân',
            age: 22,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0709991442',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user22@gmail.com',
            fullName: 'Đinh Trung Nam',
            age: 29,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0788442233',
            genderCode: GENDER_Male,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
          {
            email: 'user23@gmail.com',
            fullName: 'Hoàng Bảo Châu',
            age: 23,
            password: this.userService.getHashPassword(initPassword || 'default123'),
            phoneNumber: '0726655443',
            genderCode: GENDER_Female,
            roleId: USER_ROLE,
            isVip: false,
            statusCode: 'US_ACTIVE',
            isDeleted: false,
          },
        ]);
      }

      if (countPermission === 0) {
        await this.permissionRepository.insert(INIT_PERMISSIONS);
      }

      if (count_role_perm === 0) {
        await this.role_perm_Repository.insert(INIT_ROLE_PERMISSION);
      }
      if (countCode > 0 && countUser > 0 && countPermission > 0) {
        this.logger.warn('>>> ALREADY INIT SAMPLE DATA...');
      }
    }
  }
}
