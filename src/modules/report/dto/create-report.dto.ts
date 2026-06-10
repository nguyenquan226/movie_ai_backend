import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportType } from '../entities/report.entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  description?: string;
}
