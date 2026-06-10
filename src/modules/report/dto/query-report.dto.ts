import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, ReportType } from '../entities/report.entity';

export class QueryReportDto {
  @IsEnum(ReportType)
  @IsOptional()
  reportType?: ReportType;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
