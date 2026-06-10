import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';

import { AllCodesService } from './all-codes.service';
import { CreateAllCodeDto } from './dto/create-all-code.dto';
import { UpdateAllCodeDto } from './dto/update-all-code.dto';
import { Public, ResponseMessage, SkipCheckPermission } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('all-codes')
export class AllCodesController {
  constructor(private readonly allCodesService: AllCodesService) { }

  @Post()
  @Permission('Create a Code', 'ALL-CODES')
  @ResponseMessage('Create a new code')
  create(@Body() createAllCodeDto: CreateAllCodeDto) {
    return this.allCodesService.create(createAllCodeDto);
  }

  @Get()
  @Permission('Get all codes value', 'ALL-CODES')
  @ResponseMessage('Get all codes value')
  findAll() {
    return this.allCodesService.findAll();
  }

  @Get(':id')
  @Permission('Get code by ID', 'ALL-CODES')
  @ResponseMessage('Get code by ID')
  findOne(@Param('id') id: string) {
    return this.allCodesService.findOne(+id);
  }

  @Patch(':id')
  @Permission('Update a code by id', 'ALL-CODES')
  @ResponseMessage('Update a code by id')
  update(@Param('id') id: string, @Body() updateAllCodeDto: UpdateAllCodeDto) {
    return this.allCodesService.update(+id, updateAllCodeDto);
  }

  @Delete(':id')
  @Permission('Delete a code by id', 'ALL-CODES')
  @ResponseMessage('Delete a code by id')
  remove(@Param('id') id: string) {
    return this.allCodesService.remove(+id);
  }

  @Public()
  @SkipCheckPermission()
  @Get('type/get-by-type')
  @ResponseMessage('Get all code value by type')
  getAllCodeByType(@Query('type') type: string) {
    return this.allCodesService.getAllCodeDataByType(type);
  }
}
