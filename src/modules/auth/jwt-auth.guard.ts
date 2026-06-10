import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorators/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // if (context.getType() === 'ws') {
    //   return true;
    // }
    // for example, call super.logIn(request) to establish a session.
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
    // if (context.getType() === 'ws') {
    //   return user;
    // }

    const request: Request = context.switchToHttp().getRequest();
    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException('Token is not valid or not bear token in header request');
    }

    const targetMethod = request.method;
    const targetEndpoint = (request as any).route?.path as string;

    const permissions = user?.permissions ?? [];

    let isExist = permissions.find(
      (permission) => targetEndpoint === permission.apiPath && permission.method === targetMethod,
    );

    if (targetEndpoint.startsWith('/api/v1/auth')) isExist = true;
    if (!isExist && !isSkipPermission) {
      throw new ForbiddenException('Yout are not permit to access this endpoint');
    }

    return user; //req.user
  }
}
