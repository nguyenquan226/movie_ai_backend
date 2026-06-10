import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ActorService } from './actor.service';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { PaginationActorDto } from './dto/pagination-actor.dto';
import { Public, ResponseMessage, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('actor')
export class ActorController {
  constructor(private readonly actorService: ActorService) { }

  @Post('create-actor')
  @Permission('Create an actor', 'ACTOR')
  @ResponseMessage('Create a new actor')
  async createActor(@Body() dto: CreateActorDto, @User() user: IUser) {
    return await this.actorService.createActor(dto, user);
  }

  @Post('create-list-actor')
  @Permission('Create a list of actors', 'ACTOR')
  @ResponseMessage('Create a new actor')
  async createListActor(@Body() dto: CreateActorDto[], @User() user: IUser) {
    return await this.actorService.createListActor(dto, user);
  }

  @Get('all-actors')
  @Permission('Get all actors', 'ACTOR')
  @ResponseMessage('Get all actors with pagination, filtering, and sorting')
  async getAllActors(@Query() query: PaginationActorDto) {
    return await this.actorService.getAllActors(query);
  }

  @Public()
  @Get('get-actor-by-id/:actorId')
  @Permission('Get actor by ID', 'ACTOR')
  @ResponseMessage('Get actor by ID')
  async getActorById(@Param('actorId') actorId: number) {
    return await this.actorService.getActorById(actorId);
  }
  @Public()
  @Get('get-actor-by-slug/:actorSlug')
  @Permission('Get actor by slug', 'ACTOR')
  @ResponseMessage('Get actor by Slug')
  async getActorBySlug(@Param('actorSlug') actorSlug: string) {
    return await this.actorService.getActorBySlug(actorSlug);
  }

  @Patch('update-actor/:actorId')
  @Permission('Update actor', 'ACTOR')
  @ResponseMessage('Update actor by ID')
  async updateActor(@Param('actorId') actorId: number, @Body() update: UpdateActorDto, @User() user: IUser) {
    return await this.actorService.updateActor(actorId, update, user);
  }

  @Delete('delete-actor-by-id/:actorId')
  @Permission('Delete actor by ID', 'ACTOR')
  @ResponseMessage('Delete actor by ID')
  async deleteActorById(@Param('actorId') actorId: number, @User() user: IUser) {
    return await this.actorService.deleteActorById(actorId, user);
  }
}
