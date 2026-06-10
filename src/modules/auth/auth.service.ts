import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { IUser } from 'src/modules/users/interface/user.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { Response } from 'express';
import { RegisterUserDto } from 'src/modules/users/dto/register-user.dto';
import { RolesService } from '../roles/roles.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private roleService: RolesService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUserName(email);
    if (user) {
      const isValidPassword = this.usersService.isValidPassword(pass, user.password);
      if (isValidPassword) {
        const temp = await this.roleService.findOne(user.roleId);

        const { password, ...result } = user;
        const objectUser = {
          ...result,
          roleName: temp.role?.roleName,
          permissions: temp.role?.permissons,
        };
        return objectUser;
      }
    }
    return { EC: 0, EM: 'Invalid username or password' };
  }

  generateRefreshToken = (payload: any) => {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('REFRESH_TOKEN_expiresIn') as ms.StringValue) / 1000,
    });
    return { EC: 1, EM: 'Create refresh token successfully', refreshToken };
  };

  async login(user: any, response: Response) {
    const {
      userId,
      email,
      roleId,
      fullName,
      genderCode,
      isVip,
      statusCode,
      permissions,
      roleName,
      avatarUrl,
    } = user;
    const payload = {
      iss: 'from server',
      sub: 'token login',
      userId,
      email,
      roleId,
      roleName,
      fullName,
      genderCode,
      isVip,
      statusCode,
      avatarUrl,
    };
    //generate refresh token
    const refresh_token = this.generateRefreshToken(payload);
    await this.usersService.updateUserToken(refresh_token.refreshToken, userId);

    response.cookie('refresh_token', refresh_token.refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_expiresIn')),
    });
    return {
      EC: 1,
      EM: 'Login successfully',
      access_token: this.jwtService.sign(payload),
      user: {
        userId,
        email,
        roleId,
        roleName,
        fullName,
        genderCode,
        isVip,
        statusCode,
        permissions,
        avatarUrl,
      },
    };
  }

  async register(user: RegisterUserDto) {
    await this.emailService.sendMailAfterRegister(user.fullName, user.email);
    return await this.usersService.register(user);
  }

  async handleLogout(respones: Response, user: IUser) {
    await this.usersService.updateUserToken('', user.userId);
    respones.clearCookie('refresh_token');
    return { EC: 1, EM: 'Logout ok' };
  }

  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: ms(this.configService.get<string>('REFRESH_TOKEN_expiresIn')) / 1000,
    });
    return { EC: 1, EM: 'Create refresh token successfully', refresh_token };
  };

  async processNewToken(refreshToken: string, response: Response) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findUserByRefreshToken(refreshToken);
      if (user) {
        const {
          userId,
          email,
          roleId,
          fullName,
          genderCode,
          isVip,
          statusCode,
          roleName,
          avatarUrl,
        } = user;
        const payload = {
          iss: 'from server',
          sub: 'token login',
          userId,
          email,
          roleId,
          roleName,
          fullName,
          genderCode,
          isVip,
          statusCode,
          avatarUrl,
        };
        const refresh_token = this.createRefreshToken(payload);

        await this.usersService.updateUserToken(refresh_token.refresh_token, userId);
        const temp = await this.roleService.findOne(user.roleId);

        response.clearCookie('refresh_token');
        response.cookie('refresh_token', refresh_token.refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_expiresIn')),
        });
        return {
          EC: 1,
          EM: 'Get new token successfully',
          access_token: this.jwtService.sign(payload),
          user: {
            userId,
            email,
            roleId,
            roleName,
            fullName,
            genderCode,
            isVip,
            statusCode,
            avatarUrl,
            permissions: temp.role?.permissons,
          },
        };
      } else {
        throw new BadRequestException(`Refresh token invalid. Please log in.`);
      }
    } catch (error) {
      throw new BadRequestException('Refresh token invalid. Please log in.');
    }
  }
}
