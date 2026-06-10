import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CoWatchingService } from './co-watching.service';
import { CreateCoWatchingDto } from './dto/create-co-watching.dto';
import { UpdateCoWatchingDto } from './dto/update-co-watching.dto';
import type { IUser } from '../users/interface/user.interface';
import { Public, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('co-watching')
export class CoWatchingController {
  constructor(private readonly coWatchingService: CoWatchingService) {}

  @Post()
  @Permission('Create co-watching rooom', 'CO-WATCHING')
  async create(@Body() createCoWatchingDto: CreateCoWatchingDto, @User() user: IUser) {
    return this.coWatchingService.create(createCoWatchingDto, user);
  }

  @Public()
  @Get()
  @Permission('Get all co-watching roooms', 'CO-WATCHING')
  findAll(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query('isMain') isMain: boolean,
    @Query() qs: string,
  ) {
    return this.coWatchingService.findAll(page, limit, isMain, qs);
  }

  @Public()
  @Get(':id')
  @Permission('Get co-watching rooom by ID', 'CO-WATCHING')
  findOne(@Param('id') id: string) {
    return this.coWatchingService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update co-watching rooom', 'CO-WATCHING')
  update(@Param('id') id: string, @Body() updateCoWatchingDto: UpdateCoWatchingDto) {
    return this.coWatchingService.update(id, updateCoWatchingDto);
  }

  @Delete(':id')
  @Permission('Delete co-watching rooom', 'CO-WATCHING')
  remove(@Param('id') id: string) {
    return this.coWatchingService.remove(id);
  }
}
