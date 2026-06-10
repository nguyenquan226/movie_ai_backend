import { PartialType } from '@nestjs/mapped-types';
import { CreateCoWatchingDto } from './create-co-watching.dto';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCoWatchingDto extends PartialType(CreateCoWatchingDto) {
  @IsOptional()
  @IsInt({ message: 'Duration must be an integer.' })
  @Min(0, { message: 'Duration cannot be negative.' })
  duration?: number;
}
