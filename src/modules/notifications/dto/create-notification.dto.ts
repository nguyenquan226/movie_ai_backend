import { IsNotEmpty, IsNumber, IsString, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

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
  @IsNumber()
  @Type(() => Number)
  replierId?: number;

  @IsOptional()
  result?: any;
}
