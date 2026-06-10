import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { LocalAuthGuard } from 'src/modules/auth/local-auth.guard';
import type { Request, Response } from 'express';
import type { IUser } from 'src/modules/users/interface/user.interface';
import { RegisterUserDto } from 'src/modules/users/dto/register-user.dto';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly roleService: RolesService,
    private readonly userService: UsersService,
  ) { }

  @Public()
  @Post('login')
  @Permission('User login', 'AUTH')
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('User Login')
  login(@Req() req, @Res({ passthrough: true }) response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @ResponseMessage('Get User by refresh token')
  @Get('/refreshToken')
  @Permission('Refresh token', 'AUTH')
  handleRefreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken: string = request.cookies['refresh_token'];
    return this.authService.processNewToken(refreshToken, response);
  }

  @Get('/account')
  @Permission('Get account information', 'AUTH')
  @ResponseMessage('Get User information')
  async handleGetAccount(@User() user: IUser) {
    const newUserInfor = await this.userService.findOne(user.userId);
    const returnUser: IUser = {
      userId: newUserInfor.userId,
      email: newUserInfor.email,
      fullName: newUserInfor.fullName,
      roleId: newUserInfor.roleId,
      roleName: newUserInfor.role.roleName,
      genderCode: newUserInfor.genderCode,
      isVip: newUserInfor.isVip,
      statusCode: newUserInfor.statusCode,
      avatarUrl: newUserInfor.avatarUrl,
    };
    const temp = await this.roleService.findOne(user.roleId);
    returnUser.permissions = temp.role?.permissons;
    return { user: returnUser };
  }

  @Public()
  @Post('register')
  @Permission('Register user', 'AUTH')
  @ResponseMessage('Register a new user')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @ResponseMessage('User log out')
  @Post('/logout')
  @Permission('User log out', 'AUTH')
  logout(@Res({ passthrough: true }) response: Response, @User() user: IUser) {
    return this.authService.handleLogout(response, user);
  }
}
