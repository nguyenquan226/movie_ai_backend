import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { FilmsService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';
import { AdminFilmService } from './admin-film/admin-film.service';

@Controller('films')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
export class FilmsController {
  constructor(
    private readonly filmsService: FilmsService,
    private readonly adminFilmService: AdminFilmService,
  ) {}

  @Post()
  @Permission('Create a film', 'FILMS')
  create(@Body() createFilmDto: CreateFilmDto, @User() user: IUser) {
    return this.adminFilmService.create(createFilmDto, user);
  }

  @Public()
  @Get('/admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.adminFilmService.findAll(page, limit, qs);
  }

  @Public()
  @Get('/admin/deleted')
  @ResponseMessage('Get Film Deleted Paginate')
  findAllAdminDeleted(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.adminFilmService.getAllFilmDeleted(page, limit, qs);
  }

  @Public()
  @Get()
  @Permission('Get all films', 'FILMS')
  findAll(@Query('current') page: number, @Query('pageSize') limit: number, @Query() qs: string) {
    return this.filmsService.findAll(page, limit, qs);
  }

  @Public()
  @Get('/suggest-list')
  filmSuggest() {
    return this.filmsService.getFilmSuggest();
  }

  @Public()
  @Get('film-vip')
  findAllVIP() {
    return this.filmsService.findAllVip();
  }

  @Public()
  @SkipCheckPermission()
  @Get(':id')
  @Permission('Get film by ID', 'FILMS')
  findOne(@Param('id') id: string) {
    return this.filmsService.findOne(id);
  }

  @Public()
  @Get('slug/:slug')
  @Permission('Get film by slug', 'FILMS')
  findOneBySlug(@Param('slug') slug: string) {
    return this.filmsService.findOneBySlug(slug);
  }

  @Patch(':id')
  @Permission('Update film', 'FILMS')
  update(@Param('id') id: string, @Body() updateFilmDto: UpdateFilmDto, @User() user: IUser) {
    return this.adminFilmService.update(id, updateFilmDto, user);
  }

  @Patch('admin/restore/:id')
  @Permission('Restore data film', 'FILMS')
  @ResponseMessage('Restore data film')
  restore(@Param('id') id: string) {
    return this.adminFilmService.restoreFilm(id);
  }

  @SkipCheckPermission()
  @Patch('admin/restore_list')
  @Permission('Restore list data film', 'FILMS')
  @ResponseMessage('Restore list data film')
  restoreList(@Body('filmIds') filmIds: string[]) {
    return this.adminFilmService.restoreListFilm(filmIds);
  }

  @Delete(':id')
  @Permission('Delete film', 'FILMS')
  @ResponseMessage('Soft delete film')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.adminFilmService.remove(id, user);
  }

  @SkipCheckPermission()
  @Delete('admin/sort_delete')
  @Permission('Delete List film', 'FILMS')
  @ResponseMessage('Soft delete list film')
  bulkRemove(@Body('filmIds') filmIds: string[], @User() user: IUser) {
    return this.adminFilmService.bulkRemove(filmIds, user);
  }

  @Delete('admin/hard_delete/:id')
  @Permission('Hard Delete film', 'FILMS')
  @ResponseMessage('Hard delete film')
  hardDelete(@Param('id') id: string) {
    return this.adminFilmService.hardDelete(id);
  }

  @Delete('admin/hard_delete_list')
  @Permission('Hard Delete List Film', 'FILMS')
  @ResponseMessage('Hard delete list film')
  hardDeleteList(@Body('filmIds') filmIds: string[]) {
    return this.adminFilmService.hardDeleteList(filmIds);
  }

  @Public()
  @Get('by-country/:countryValueEn')
  @Permission('Get films by country', 'FILMS')
  findByCountry(
    @Param('countryValueEn') countryValueEn: string,
    @Query('current') page: number,
    @Query('pageSize') limit: number,
  ) {
    return this.filmsService.findByCountry(countryValueEn, page, limit);
  }

  @Public()
  @SkipCheckPermission()
  @Get('by-genre/:genreValueEn')
  @Permission('Get films by genre', 'FILMS')
  findByGenre(
    @Param('genreValueEn') genreValueEn: string,
    @Query('current') page: number,
    @Query('pageSize') limit: number,
  ) {
    return this.filmsService.findByGenre(genreValueEn, page, limit);
  }

  @Public()
  @SkipCheckPermission()
  @Get('by-type/:typeValueEn')
  @Permission('Get films by type', 'FILMS')
  findByType(
    @Param('typeValueEn') typeValueEn: string,
    @Query('current') page: number,
    @Query('pageSize') limit: number,
  ) {
    return this.filmsService.findByType(typeValueEn, page, limit);
  }

  @Public()
  @SkipCheckPermission()
  @Get('filter/search')
  @Permission('Search films with filters', 'FILMS')
  findWithFilters(
    @Query('country') country?: string,
    @Query('type') type?: string,
    @Query('age_code') age_code?: string,
    @Query('genre') genre?: string,
    @Query('version') version?: string,
    @Query('year') year?: string,
    @Query('sort') sort?: string,
    @Query('current') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.filmsService.findWithFilters(
      { country, type, age_code, genre, version, year },
      sort,
      page,
      limit,
    );
  }

  @Public()
  @Get('/list-film-by-genre/chatbot')
  getFilmDataForChatBotByGenre() {
    return this.filmsService.getFilmByGenreForChatBotData();
  }

  @Public()
  @Get('/list-film-by-country/chatbot')
  getFilmDataForChatBotByCountry() {
    return this.filmsService.getFilmByCountryForChatBotData();
  }

  @SkipCheckPermission()
  @Permission('Get data genre chart', 'FILMS')
  @Get('/chart/genre')
  getChartDataGenre() {
    return this.filmsService.getChartDataGenre();
  }

  @SkipCheckPermission()
  @Permission('Get data chart', 'FILMS')
  @Get('/chart/allcode')
  getChartDataAge(@Query('type') type: string) {
    return this.filmsService.getChartDataAllCode(type);
  }

  @SkipCheckPermission()
  @Permission('Update Views Film', 'FILMS')
  @Post('/:filmId/view')
  updateView(@Param('filmId') filmId: string, @User() user: IUser) {
    return this.filmsService.updateView(filmId, user.userId.toString());
  }
}
