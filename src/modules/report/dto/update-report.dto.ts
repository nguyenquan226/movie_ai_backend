import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
