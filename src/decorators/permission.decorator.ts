export const PERMISSION_METADATA = 'permission_metadata';
export interface PermissionMeta {
  name: string;
  module: string;
}

export const Permission = (name: string, module: string): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(PERMISSION_METADATA, { name, module }, descriptor.value!);
  };
};