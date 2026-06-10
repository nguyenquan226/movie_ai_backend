import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { FilmDirectorService } from './film_director.service';
import { CreateFilmDirectorDto } from './dto/create-film_director.dto';
import { UpdateFilmDirectorDto } from './dto/update-film_director.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { PaginationfdDto } from './dto/pagination-fd.dto';
import type { IUser } from '../users/interface/user.interface';
import { Permission } from 'src/decorators/permission.decorator';

@Controller('film-director')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
export class FilmDirectorController {
  constructor(private readonly filmDirectorService: FilmDirectorService) {}

  @Post('create-film-director')
  @Permission('Create a film-director relation', 'FILM-DIRECTOR')
  @ResponseMessage('Create relation between film and director')
  createFilmDirector(@Body() dto: CreateFilmDirectorDto, @User() user: IUser) {
    return this.filmDirectorService.createFilmDirector(dto, user);
  }

  @Get('all-film-directors')
  @Permission('Get all film-director relations', 'FILM-DIRECTOR')
  @ResponseMessage('Get all film-director relations')
  GetAllFilmDirectors(@Query() query: PaginationfdDto) {
    return this.filmDirectorService.getAllFilmDirectors(query);
  }

  @Public()
  @Get('get-film-director-by-id/:id')
  @Permission('Get a film-director relation by ID', 'FILM-DIRECTOR')
  @ResponseMessage('Get film-director relation by id')
  getFilmDirectorById(@Param('id') id: number) {
    return this.filmDirectorService.getFilmDirectorById(id);
  }

  @Public()
  @SkipCheckPermission()
  @Get('by-film/:filmId')
  @Permission('Get directors by film ID', 'FILM-DIRECTOR')
  @ResponseMessage('Get directors by film')
  getDirectorsByFilm(@Param('filmId') filmId: string, @Query() query: PaginationfdDto) {
    return this.filmDirectorService.getDirectorsByFilm(filmId, query);
  }

  @Public()
  @Get('by-director/:directorId')
  @Permission('Get films by director ID', 'FILM-DIRECTOR')
  @ResponseMessage('Get films by director')
  getFilmsByDirector(@Param('directorId') directorId: number, @Query() query: PaginationfdDto) {
    return this.filmDirectorService.getFilmsByDirector(directorId, query);
  }

  @Public()
  @Get('by-director-slug/:directorSlug')
  @Permission('Get films by director slug', 'FILM-DIRECTOR')
  @ResponseMessage('Get films by director slug')
  getFilmsByDirectorSlug(
    @Param('directorSlug') directorSlug: string,
    @Query() query: PaginationfdDto,
  ) {
    return this.filmDirectorService.getFilmsByDirectorSlug(directorSlug, query);
  }

  @Patch('edit-film-director/:id')
  @Permission('Update a film-director relation by ID', 'FILM-DIRECTOR')
  @ResponseMessage('Update film-director relation by id')
  updateFilmDirector(
    @Param('id') id: number,
    @Body() dto: UpdateFilmDirectorDto,
    @User() user: IUser,
  ) {
    return this.filmDirectorService.updateFilmDirector(id, dto, user);
  }

  @Delete('delete-film-director/:id')
  @Permission('Delete a film-director relation by ID', 'FILM-DIRECTOR')
  @ResponseMessage('Delete film-director relation by id')
  deleteFilmDirector(@Param('id') id: number, @User() user: IUser) {
    return this.filmDirectorService.deleteFilmDirector(id, user);
  }

  @Public()
  @Get('group-directors-and-films-lodash')
  @Permission('Get grouped directors and films by lodash', 'FILM-DIRECTOR')
  @ResponseMessage('Get grouped directors and films by lodash')
  getGroupedDirectorsAndFilms() {
    return this.filmDirectorService.groupFilmsByDirectorLodash();
  }
}
