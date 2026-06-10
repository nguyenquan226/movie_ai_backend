import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FilmSearchService } from './filmSearch.service';
import { Public, ResponseMessage, SkipCheckPermission } from 'src/decorators/customize';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from '../films/entities/film.entity';
import { ActorSearchService } from './actorSearch.service';
import { Actor } from '../actor/entities/actor.entity';
import { Director } from '../directors/entities/director.entity';
import { Producer } from '../producers/entities/producer.entity';
import { ProducerSearchService } from './producerSearch.service';
import { DirectorSearchService } from './directorSearch.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly filmSearchService: FilmSearchService,
    private readonly actorSearchService: ActorSearchService,
    private readonly directorSearchService: DirectorSearchService,
    private readonly producerSearchService: ProducerSearchService,
    @InjectRepository(Film) private filmsRepository: Repository<Film>,
    @InjectRepository(Actor) private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Director) private readonly directorRepository: Repository<Director>,
    @InjectRepository(Producer) private readonly producerRepository: Repository<Producer>,
  ) {}
  @Get('/films')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('search films')
  async searchFilms(@Query('q') q: string) {
    return this.filmSearchService.searchFilms(q);
  }

  @Get('/actors')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('search actors')
  async searchActors(@Query('q') q: string) {
    return this.actorSearchService.searchActors(q);
  }
  @Get('/directors')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('search films')
  async searchDirectors(@Query('q') q: string) {
    return this.directorSearchService.searchDirectors(q);
  }

  @Get('/producers')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('search films')
  async searchProducers(@Query('q') q: string) {
    return this.producerSearchService.searchProducers(q);
  }

  @Delete('/films')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Delete Films index')
  async deleteIndex() {
    return this.filmSearchService.deleteIndexFilm();
  }

  @Get('/sync/films')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('bulk index film')
  async syncFilms() {
    const films = await this.filmsRepository.find(); // lấy toàn bộ films
    return this.filmSearchService.bulkIndexFilms(films);
  }

  @Get('/sync/actors')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('bulk index actors')
  async syncActors() {
    const actors = await this.actorRepository.find();
    return this.actorSearchService.bulkIndexActors(actors);
  }

  @Get('/sync/directors')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('bulk index actors')
  async syncDirectors() {
    const directors = await this.directorRepository.find();
    return this.directorSearchService.bulkIndexDirectors(directors);
  }

  @Get('/sync/producers')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('bulk index actors')
  async syncProducers() {
    const producers = await this.producerRepository.find();
    return this.producerSearchService.bulkIndexProducers(producers);
  }

  @Get('/get-All-Films-From-Index')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Get all films from films Index')
  async getAllFilmsFromIndex() {
    return this.filmSearchService.getAllFilmDocument();
  }

  @Get('/get-All-From-Index')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Get all data from Index')
  async getAllFromIndex() {
    return this.actorSearchService.getAllDocument('actors');
  }

  @Get('/films/count')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Count film in films index')
  async countFilms() {
    return this.filmSearchService.countFilms();
  }

  @Delete('/films/:filmId')
  @Public()
  @SkipCheckPermission()
  async TESTdeleteFilmFromIndex(@Param('filmId') filmId: string) {
    return this.filmSearchService.removeFilmFromIndex(filmId);
  }

  @Delete('/delete-all')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Delete all documents in  Films index')
  async deleteAllDocumentInFilmIndex() {
    return this.filmSearchService.clearDocumentInFilmIndex();
  }
}
