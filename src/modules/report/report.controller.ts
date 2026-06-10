import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { User } from 'src/decorators/customize';
import type { IUser } from '../users/interface/user.interface';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Permission('Create report', 'REPORT')
  createReport(@Body() dto: CreateReportDto, @User() user: IUser) {
    return this.reportService.createReport(dto, user);
  }

  @Get()
  @Permission('Get all reports', 'REPORT')
  getReports(@Query() query: QueryReportDto) {
    return this.reportService.getReports(query);
  }

  @Post(':id/dismiss')
  @Permission('Dismiss report', 'REPORT')
  dismissReport(@Param('id') id: string, @Body() body: { note?: string }, @User() user: IUser) {
    return this.reportService.dismissReport(id, user.userId, body.note);
  }

  @Post(':id/delete-target')
  @Permission('Delete target from report', 'REPORT')
  deleteTargetFromReport(
    @Param('id') id: string,
    @Body() body: { reason?: string; note?: string },
    @User() user: IUser,
  ) {
    return this.reportService.deleteTargetFromReport(id, user, body.reason, body.note);
  }

  @Post(':id/hard-delete-target')
  @Permission('Hard delete target from report', 'REPORT')
  hardDeleteTargetFromReport(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @User() user: IUser,
  ) {
    return this.reportService.hardDeleteTargetFromReport(id, user, body.note);
  }
}
