import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto-director/create-director.dto';
import { UpdateDirectorDto } from './dto-director/update-director.dto';
import { PaginationDto } from './dto-director/pagination.dto';
import { Public, ResponseMessage, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('director')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) { }

  @Post('create-director')
  @Permission('Create a director', 'DIRECTOR')
  @ResponseMessage('Create a new director')
  async createDirector(@Body() dto: CreateDirectorDto, @User() user: IUser) {
    return await this.directorService.createDirector(dto, user);
  }

  @Get('get-all-directors')
  @Permission('Get all directors', 'DIRECTOR')
  @ResponseMessage('Get all directors with pagination, filtering, and sorting')
  async getAllDirectors(@Query() query: PaginationDto) {
    return await this.directorService.getAllDirectors(query);
  }

  @Public()
  @Get('get-director-by-id/:directorId')
  @Permission('Get director by ID', 'DIRECTOR')
  @ResponseMessage('Get director by ID')
  async getDirectorById(@Param('directorId', ParseIntPipe) directorId: number) {
    return await this.directorService.getDirectorById(directorId);
  }

  @Public()
  @Get('get-director-by-slug/:directorSlug')
  @Permission('Get director by slug', 'DIRECTOR')
  @ResponseMessage('Get director by slug')
  async getDirectorBySlug(@Param('directorSlug') directorSlug: string) {
    return await this.directorService.getDirectorBySlug(directorSlug);
  }

  @Patch('edit-director/:directorId')
  @Permission('Edit a director', 'DIRECTOR')
  @ResponseMessage('Edit director by ID')
  async updateDirector(
    @Param('directorId', ParseIntPipe) directorId: number,
    @Body() dto: UpdateDirectorDto,
    @User() user: IUser,
  ) {
    return await this.directorService.updateDirector(directorId, dto, user);
  }

  @Delete('delete-director-by-id/:directorId')
  @Permission('Delete a director by ID', 'DIRECTOR')
  @ResponseMessage('Delete director by ID')
  async deleteDirectorById(
    @Param('directorId', ParseIntPipe) directorId: number,
    @User() user: IUser,
  ) {
    return await this.directorService.deleteDirectorById(directorId, user);
  }
}
