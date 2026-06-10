import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

//Public
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

//User
export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});

//Response_message
export const RESPONSE_MESSAGE = 'response_message';
export const ResponseMessage = (message: string) => {
  return SetMetadata(RESPONSE_MESSAGE, message);
};

export const IS_PUBLIC_PERMISSION = 'isPublicPermission';
export const SkipCheckPermission = () => SetMetadata(IS_PUBLIC_PERMISSION, true);
