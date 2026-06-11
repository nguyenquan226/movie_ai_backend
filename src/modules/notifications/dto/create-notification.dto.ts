import { IsNotEmpty, IsNumber, IsString, IsOptional, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'reply',
    'reaction',
    'system',
    'report',
    'hidden_comment',
    'report_result',
    'violation_warning',
  ])
  type: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsUUID()
  replierId?: string;

  @IsOptional()
  result?: any;
}
