import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignRoleDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetRoleId: number;
}
