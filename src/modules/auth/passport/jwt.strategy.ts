import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from 'src/modules/users/interface/user.interface';
import { RolesService } from 'src/modules/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private roleService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET')!,
    });
  }

  async validate(payload: IUser) {
    const { userId, fullName, email, roleId, genderCode, isVip, statusCode, roleName, avatarUrl } =
      payload;
    const temp = await this.roleService.findOne(roleId);

    return {
      userId,
      email,
      roleId,
      roleName,
      fullName,
      genderCode,
      isVip,
      statusCode,
      avatarUrl,
      permissions: temp?.role?.permissons ?? [],
    };
  }
}
