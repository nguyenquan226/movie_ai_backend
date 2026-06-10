import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  Query,
} from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { Public, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('episodes')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) { }

  @Post()
  @Permission('Create an episode', 'EPISODES')
  create(@Body() createEpisodeDto: CreateEpisodeDto, @User() user: IUser) {
    return this.episodesService.create(createEpisodeDto, user);
  }

  @Post('create-list')
  @Permission('Create list of episodes', 'EPISODES')
  createMany(@Body() createListEpisodeDto: CreateEpisodeDto[], @User() user: IUser) {
    return this.episodesService.createListEpisode(createListEpisodeDto, user);
  }

  @Public()
  @Get()
  @Permission('Get all episodes', 'EPISODES')
  findAll(@Query('current') page: number, @Query('pageSize') limit: number, @Query() qs: string) {
    return this.episodesService.findAll(page, limit, qs);
  }

  @Public()
  @Get(':id')
  @Permission('Get episode by ID', 'EPISODES')
  findOne(@Param('id') id: string) {
    return this.episodesService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update episode by ID', 'EPISODES')
  update(@Param('id') id: string, @Body() updateEpisodeDto: UpdateEpisodeDto, @User() user: IUser) {
    return this.episodesService.update(id, updateEpisodeDto, user);
  }

  @Delete(':id')
  @Permission('Delete episode by ID', 'EPISODES')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.episodesService.remove(id, user);
  }
}
