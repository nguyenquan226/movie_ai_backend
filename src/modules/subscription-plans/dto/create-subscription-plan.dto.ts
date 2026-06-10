import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsNotEmpty({ message: 'planName must be not Empty' })
  @IsString({ message: 'planName must be string format' })
  planName: string;

  @IsNotEmpty({ message: 'planDuration must be not Empty' })
  @Type(() => Number)
  planDuration: number;

  @IsNotEmpty({ message: 'durationTypeCode must be not Empty' })
  @IsString({ message: 'durationTypeCode must be string format' })
  durationTypeCode: string;

  @IsNotEmpty({ message: 'price must be not Empty' })
  @IsString({ message: 'price must be string format' })
  price: string;

  @IsNotEmpty({ message: 'price must be not Empty' })
  @IsBoolean({ message: 'isActive must be Boolean format' })
  @Type(() => Boolean)
  isActive: boolean;
}
