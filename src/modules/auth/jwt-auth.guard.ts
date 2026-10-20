import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorators/customize';
import { hasMatchingPermission } from 'src/common/utils/permission.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (err || !user) {
      throw err || new UnauthorizedException('Token is not valid or not bear token in header request');
    }

    const targetMethod = request.method;
    const targetEndpoint = (request as Request & { route?: { path?: string } }).route?.path;

    const isExist = hasMatchingPermission(user?.permissions, targetMethod, targetEndpoint);

    if (!isExist && !isSkipPermission) {
      throw new ForbiddenException('Yout are not permit to access this endpoint');
    }

    return user;
  }
}
