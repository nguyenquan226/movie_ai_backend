import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { RegisterUserDto } from 'src/modules/users/dto/register-user.dto';
import { IUser } from 'src/modules/users/interface/user.interface';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import aqp from 'api-query-params';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const isUserExist = await this.usersRepository.findOne({
        where: {
          email: createUserDto.email,
        },
      });

      if (isUserExist) {
        return {
          EC: 2,
          EM: `Email: ${createUserDto.email} already exists in the system. Please use a different email.`,
        };
      } else {
        const hasedPassword = this.getHashPassword(createUserDto.password);

        const newuser = this.usersRepository.create({
          ...createUserDto,
          password: hasedPassword,
        });
        await this.usersRepository.save(newuser);
        return {
          EC: 1,
          EM: 'Create user success',
          userId: newuser.userId,
          createdAt: newuser.createdAt,
        };
      }
    } catch (error) {
      console.error('Error in create user:', error.message);
      console.log('check erro create usser', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from create user service',
      });
    }
  }

  async findAll() {
    try {
      const listUsers = await this.usersRepository.find({});
      return {
        EC: 1,
        EM: 'Get all users success',
        users: listUsers,
      };
    } catch (error) {
      console.error('Error in getAll user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAll user service',
      });
    }
  }

  async findOne(id: number) {
    try {
      const userData = await this.usersRepository.findOne({
        where: { userId: id },
        relations: ['gender', 'role'],
        select: {
          role: {
            roleId: true,
            roleName: true,
          },
          gender: {
            keyMap: true,
            valueEn: true,
            valueVi: true,
            description: true,
          },
        },
      });

      if (!userData) {
        throw new BadRequestException({
          EC: 0,
          EM: 'User Not Found',
        });
      } else {
        return {
          EC: 1,
          EM: 'Get user success',
          ...userData,
          roleName: userData.role.roleName,
        };
      }
    } catch (error) {
      console.error('Error in findOne user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne User service',
      });
    }
  }

  async update(updateUser: UpdateUserDto, user: IUser) {
    console.log('check data update: ', updateUser);
    try {
      const updated = await this.usersRepository.update(
        {
          userId: updateUser.userId,
        },
        {
          ...updateUser,
          updatedBy: user.userId,
          updatedAt: new Date(),
        },
      );

      if (updated.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      }

      return {
        EC: 1,
        EM: 'Update user success',
        ...updated,
      };
    } catch (error: any) {
      console.error('Error in update user:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update user service',
      });
    }
  }
  async updateProfile(updateUser: UpdateProfileDto, user: IUser) {
    console.log('check data update: ', updateUser);
    try {
      const updated = await this.usersRepository.update(
        {
          userId: updateUser.userId,
        },
        {
          ...updateUser,
          updatedBy: user.userId,
          updatedAt: new Date(),
        },
      );

      if (updated.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      }

      return {
        EC: 1,
        EM: 'updateProfile user success',
        ...updated,
      };
    } catch (error: any) {
      console.error('Error in updateProfile user:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateProfile user service',
      });
    }
  }

  async remove(id: number, user: IUser) {
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { userId: id },
      });

      if (!foundUser) {
        throw new BadRequestException({
          EC: 0,
          EM: 'not found user',
        });
      }

      if (foundUser && foundUser.email === 'admin@gmail.com') {
        return { EC: 0, EM: 'CAN NOT DELETE ADMIN ACCOUNT : admin@gmail.com' };
      }

      const deleted = await this.usersRepository.update(
        { userId: id },
        {
          isDeleted: true,
          deletedBy: user.userId,
          deletedAt: new Date(),
        },
      );

      if (deleted.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      } else {
        return {
          EC: 1,
          EM: `user is deleted`,
          userId: id,
        };
      }
    } catch (error) {
      console.error('Error in delete user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from delete user service',
      });
    }
  }

  async findOneByUserName(userName: string) {
    return this.usersRepository.findOne({
      where: { email: userName },
      select: {
        email: true,
        password: true,
        userId: true,
        roleId: true,
        fullName: true,
        genderCode: true,
        isVip: true,
        statusCode: true,
        avatarUrl: true,
      },
    });
  }

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  // async findUserByRefreshToken(refresh_token: string) {
  //   return await this.usersRepository.findOne({
  //     where: { refreshToken: refresh_token },
  //   });
  // }

  async findUserByRefreshToken(refresh_token: string) {
    const user = await this.usersRepository.findOne({
      where: { refreshToken: refresh_token },
      relations: ['role'],
    });

    const roleName = user?.role.roleName;
    if (!user) return null;
    return {
      ...user,
      roleName,
    };
  }

  async updateUserToken(refresh_token: string, id: number) {
    return await this.usersRepository.update({ userId: id }, { refreshToken: refresh_token });
  }

  async register(user: RegisterUserDto) {
    try {
      // const { email, password, genderCode, phoneNumber, age, fullName, roleId } = user;
      const { email, password, fullName } = user;
      const isUserExist = await this.usersRepository.findOne({
        where: { email: email },
      });

      if (isUserExist) {
        return {
          EC: 0,
          EM: `Email: ${email} already exists in the system. Please use a different email.`,
        };
      } else {
        const hashedPassword = this.getHashPassword(password);
        const newUser = this.usersRepository.create({
          email,
          fullName,
          password: hashedPassword,
          // genderCode,
          // phoneNumber,
          // age,
          roleId: 3,
        });

        await this.usersRepository.save(newUser);
        return {
          EC: 1,
          EM: 'User register success',
          newUser,
        };
      }
    } catch (error) {
      console.error('Error in register user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from register user service',
      });
    }
  }

  async getUsersWithPagination(currentPage: number, limit: number, qs: string) {
    try {
      const { filter, sort } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const offset = (+currentPage - 1) * +limit;
      const defaultLimit = +limit ? +limit : 10;
      const totalItems = (await this.usersRepository.find(filter)).length;
      const totalPages = Math.ceil(totalItems / defaultLimit);
      const result = await this.usersRepository.find({
        where: filter,
        skip: offset,
        take: defaultLimit,
        order: sort,
      });

      return {
        EC: 1,
        EM: 'Get user with pagination success',
        metaData: {
          current: currentPage,
          pageSize: limit,
          totalPages: totalPages,
          totalItems: totalItems,
        },
        users: result,
      };
    } catch (error) {
      console.error('Error in getUsersWithPagination user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUsersWithPagination service',
      });
    }
  }
}
