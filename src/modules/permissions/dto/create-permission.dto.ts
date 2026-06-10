import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty({ message: 'Permission Name must not be empty' })
  @IsString({ message: 'Permission Name must be STRING format' })
  name: string;

  @IsNotEmpty({ message: 'apiPath must not be empty' })
  @IsString({ message: 'apiPath must be STRING format' })
  apiPath: string;

  @IsNotEmpty({ message: 'method must not be empty' })
  @IsString({ message: 'method must be STRING format' })
  method: string;

  @IsNotEmpty({ message: 'module must not be empty' })
  @IsString({ message: 'module must be STRING format' })
  module: string;
}
