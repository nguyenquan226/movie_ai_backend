import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IUser } from 'src/modules/users/interface/user.interface';
import { RolesService } from 'src/modules/roles/roles.service';
import { TokenBlacklistService } from 'src/modules/auth/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private roleService: RolesService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IUser) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

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
