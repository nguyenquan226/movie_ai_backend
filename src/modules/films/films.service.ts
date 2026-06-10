import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Film } from 'src/modules/films/entities/film.entity';
import { Repository } from 'typeorm';
import { isEmpty, isUUID, Length } from 'class-validator';
import aqp from 'api-query-params';
import { joinWithCommonFields } from 'src/common/utils/join-allcode';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { FilmPaginationDto, FilmResponseDto } from './dto/film-response.dto';
import { allcodeCommonFields } from 'src/common/utils/CommonField';
import { FilmDirectorService } from '../film_director/film_director.service';
import { FilmActorService } from '../film_actor/film_actor.service';
import { FilmSearchService } from '../search/filmSearch.service';
import { FilmProducerService } from '../film_producer/film_producer.service';
import { RatingService } from '../rating/rating.service';
import _ from 'lodash';
import { FilmGenre } from './entities/film_genre.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FilmsService {
  private readonly REDIS_TTL = 600;
  private readonly REIDS_TTL_GUARD = 180;

  constructor(
    @InjectRepository(FilmGenre) private filmGenreRepository: Repository<FilmGenre>,
    @InjectRepository(Film) private filmsRepository: Repository<Film>,
    private filmDirectorService: FilmDirectorService,
    private filmActorService: FilmActorService,
    private fiosearchService: FilmSearchService, //luong add
    private filmProducerService: FilmProducerService,
    private ratingService: RatingService,

    private redisService: RedisService,
  ) {}

  async updateView(filmId: string, userId: string) {
    try {
      const pendingKey = `view:film:${filmId}:pending`;
      const guardKey = `view:film:${filmId}:user:${userId}`;

      const recentlyViewed = await this.redisService.exists(guardKey);
      if (recentlyViewed) {
        console.log('>> Check Guard');
        return { EC: 0, EM: 'View already counted recently' };
      }

      await this.redisService.set(guardKey, '1', this.REIDS_TTL_GUARD);

      await this.redisService.incr(pendingKey);
      await this.redisService.expire(pendingKey, this.REDIS_TTL);

      await this.logViewEvent(filmId, userId);

      return {
        EC: 0,
        EM: 'View counted successfully',
      };
    } catch (error) {
      console.log('Error in film service updateView: ', error || error.message);
      return {
        EC: 1,
        EM: 'Error from film service updateView',
      };
    }
  }

  private async logViewEvent(filmId: string, userId: string) {
    const logKey = `view:logs:${new Date().toISOString().split('T')[0]}`;
    const logData = JSON.stringify({
      filmId,
      userId,
      timestamp: Date.now(),
    });

    await this.redisService.lpush(logKey, logData);
    await this.redisService.expire(logKey, 86400 * 7);
  }

  async getFilmSuggest() {
    try {
      const data = await this.filmsRepository.find({
        order: {
          view: 'DESC',
        },
        relations: ['filmImages', 'country', 'age'],
        take: 10,
      });

      return {
        EC: 0,
        EM: 'Get film suggest success',
        result: plainToInstance(FilmResponseDto, data),
      };
    } catch (error) {
      console.error('Error in getFilmSuggest:', error);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in getFilmSuggest',
      });
    }
  }

  async findAllVip() {
    try {
      const data = await this.filmsRepository.find({
        where: { isVip: true },
        relations: ['filmImages'],
      });
      console.log('Check data: ', data);
      return {
        EC: 0,
        EM: 'Get all film vip',
        result: plainToInstance(FilmPaginationDto, data),
      };
    } catch (error) {
      console.error('Error in film service get film vip:', error);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service get film vip',
      });
    }
  }

  async findAll(page: number, limit: number, queryString: string) {
    try {
      const { filter, projection } = aqp(queryString);
      let { sort } = aqp(queryString);

      delete filter.current;
      delete filter.pageSize;

      if (isEmpty(sort)) {
        sort = { createdAt: -1 };
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.filmsRepository.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.filmsRepository.find({
        where: filter,
        order: sort,
        select: projection,
        relations: {
          language: true,
          age: true,
          filmGenres: {
            genre: true,
          },
          filmImages: true,
        },
        skip: offset,
        take: defaultLimit,
      });

      const data = await Promise.all(
        await result.map(async (film) => {
          const result = await this.ratingService.getEverage(film.filmId);
          return {
            ...film,
            ratingEverage: +result.average,
          };
        }),
      );

      return {
        EC: 0,
        EM: 'Get film with query paginate success',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, data),
      };
    } catch (error) {
      console.error('Error in film service get film paginate:', error);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service get film paginate',
      });
    }
  }

  async findOne(id: string) {
    try {
      if (!isUUID(id)) {
        throw new BadRequestException({
          EC: 1,
          EM: `Invalid UUID format: ${id}`,
        });
      }

      const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      const film = await queryBuilder.where('film.filmId = :id', { id }).getOne();

      if (!film) {
        throw new NotFoundException({
          EC: 2,
          EM: `Film with filmId ${id} not found`,
        });
      }
      const ratingEverage = await this.ratingService.getEverage(film?.filmId);

      const actorsRes = await this.filmActorService.getActorsByFilm(id);
      if (actorsRes.EC) {
        throw new InternalServerErrorException({
          EC: 3,
          EM: actorsRes.EM,
        });
      }

      const directorsRes = await this.filmDirectorService.getDirectorsByFilm(film.filmId);
      if (directorsRes.EC) {
        throw new InternalServerErrorException({
          EC: 4,
          EM: directorsRes.EM,
        });
      }

      const producersRes = await this.filmProducerService.getProducersByFilm(id);
      if (!producersRes || !Object.prototype.hasOwnProperty.call(producersRes, 'result')) {
        throw new InternalServerErrorException({
          EC: 6,
          EM: producersRes?.EM || 'Error fetching producers for film',
        });
      }

      return {
        EC: 0,
        EM: 'Get film by Id success',

        film: plainToInstance(FilmResponseDto, { ...film, ratingEverage: ratingEverage.average }),
        directors: directorsRes.result,
        actors: actorsRes.result,
        producers: producersRes.result,
      };
    } catch (error) {
      console.error('Error in film service get film by Id:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get film by Id',
      });
    }
  }

  async findOneBySlug(slug: string) {
    try {
      const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      const film = await queryBuilder.where('film.slug = :slug', { slug }).getOne();

      if (!film) {
        throw new NotFoundException({
          EC: 2,
          EM: `Film with film slug ${slug} not found`,
        });
      }

      const ratingEverage = await this.ratingService.getEverage(film?.filmId);

      const actorsRes = await this.filmActorService.getActorsByFilm(film.filmId);
      if (actorsRes.EC) {
        throw new InternalServerErrorException({
          EC: 3,
          EM: actorsRes.EM,
        });
      }

      const directorsRes = await this.filmDirectorService.getDirectorsByFilm(film.filmId);
      if (directorsRes.EC) {
        throw new InternalServerErrorException({
          EC: 4,
          EM: directorsRes.EM,
        });
      }

      const producersRes = await this.filmProducerService.getProducersByFilm(film.filmId);
      if (!producersRes || !Object.prototype.hasOwnProperty.call(producersRes, 'result')) {
        throw new InternalServerErrorException({
          EC: 6,
          EM: producersRes?.EM || 'Error fetching producers for film',
        });
      }

      return {
        EC: 0,
        EM: 'Get film by Id success',
        film: plainToInstance(FilmResponseDto, { ...film, ratingEverage: ratingEverage.average }),
        directors: directorsRes.result,
        producers: producersRes.result,
        actors: actorsRes.result,
      };
    } catch (error) {
      console.error('Error in film service get film by Id:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get film by Id',
      });
    }
  }

  async findByCountry(countryValueEn: string, page: number, limit: number) {
    try {
      if (!countryValueEn || countryValueEn.trim() === '') {
        throw new BadRequestException({
          EC: 1,
          EM: 'Country value (valueEn) is required',
        });
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;
      const defaultPage = page ? page : 1;

      // If client requested 'All', return all films (no country filter)
      if (countryValueEn && countryValueEn.trim().toLowerCase() === 'all') {
        const totalItems = await this.filmsRepository
          .createQueryBuilder('film')
          .where('film.deletedAt IS NULL')
          .getCount();
        const totalPages = Math.ceil(totalItems / defaultLimit);

        const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
        joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
        joinWithCommonFields(
          queryBuilder,
          'film.publicStatus',
          'publicStatus',
          allcodeCommonFields,
        );
        queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
        queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
        joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

        const films = await queryBuilder
          .where('film.deletedAt IS NULL')
          .orderBy('film.createdAt', 'DESC')
          .skip(offset)
          .take(defaultLimit)
          .getMany();

        return {
          EC: 0,
          EM: 'Get films by country success (all countries)',
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: totalPages,
            total: totalItems,
          },
          result: plainToInstance(FilmPaginationDto, films),
        };
      }

      const countryAllCode = await this.filmsRepository
        .createQueryBuilder('film')
        .leftJoinAndSelect('film.country', 'country')
        .where('country.valueEn = :valueEn', { valueEn: countryValueEn })
        .select('country.keyMap', 'countryCode')
        .getRawOne();

      if (!countryAllCode || !countryAllCode.countryCode) {
        return {
          EC: 0,
          EM: `No country found with valueEn: ${countryValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: 0,
            total: 0,
          },
          result: [],
        };
      }

      const countryCode = countryAllCode.countryCode;

      const totalItems = await this.filmsRepository.count({
        where: {
          countryCode,
        },
      });

      const totalPages = Math.ceil(totalItems / defaultLimit);

      const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      const films = await queryBuilder
        .where('film.countryCode = :countryCode', { countryCode })
        .andWhere('film.deletedAt IS NULL')
        .orderBy('film.createdAt', 'DESC')
        .skip(offset)
        .take(defaultLimit)
        .getMany();

      if (films.length === 0) {
        return {
          EC: 0,
          EM: `No films found for country: ${countryValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: totalPages,
            total: totalItems,
          },
          result: [],
        };
      }

      return {
        EC: 0,
        EM: 'Get films by country success',
        meta: {
          current: defaultPage,
          pageSize: defaultLimit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, films),
      };
    } catch (error) {
      console.error('Error in film service get films by country:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get films by country',
      });
    }
  }

  async findByGenre(genreValueEn: string, page: number, limit: number) {
    try {
      if (!genreValueEn || genreValueEn.trim() === '') {
        throw new BadRequestException({
          EC: 1,
          EM: 'Genre value (valueEn) is required',
        });
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;
      const defaultPage = page ? page : 1;

      const allCodeRepository = this.filmsRepository.manager.getRepository('AllCode');
      const genre = await allCodeRepository.findOne({
        where: {
          valueEn: genreValueEn,
          type: 'GENRE',
        },
      });

      const genreCode = genre?.keyMap;

      if (genreValueEn && genreValueEn.trim().toLowerCase() === 'all') {
        const totalItems = await this.filmsRepository
          .createQueryBuilder('film')
          .where('film.deletedAt IS NULL')
          .getCount();
        const totalPages = Math.ceil(totalItems / defaultLimit);

        const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
        joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
        joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
        joinWithCommonFields(
          queryBuilder,
          'film.publicStatus',
          'publicStatus',
          allcodeCommonFields,
        );
        queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
        queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
        joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

        const films = await queryBuilder
          .where('film.deletedAt IS NULL')
          .orderBy('film.createdAt', 'DESC')
          .skip(offset)
          .take(defaultLimit)
          .getMany();

        return {
          EC: 0,
          EM: 'Get films by country success (all countries)',
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: totalPages,
            total: totalItems,
          },
          result: plainToInstance(FilmPaginationDto, films),
        };
      }

      if (!genreCode) {
        return {
          EC: 0,
          EM: `No genre found with valueEn: ${genreValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: 0,
            total: 0,
          },
          result: [],
        };
      }

      const totalItems = await this.filmsRepository
        .createQueryBuilder('film')
        .leftJoinAndSelect('film.filmGenres', 'filmGenres')
        .where('filmGenres.genreCode = :genreCode', { genreCode })
        .andWhere('film.deletedAt IS NULL')
        .getCount();

      const totalPages = Math.ceil(totalItems / defaultLimit);

      const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      const films = await queryBuilder
        .where('filmGenres.genreCode = :genreCode', { genreCode })
        .andWhere('film.deletedAt IS NULL')
        .orderBy('film.createdAt', 'DESC')
        .skip(offset)
        .take(defaultLimit)
        .getMany();

      if (films.length === 0) {
        return {
          EC: 0,
          EM: `No films found for genre: ${genreValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: totalPages,
            total: totalItems,
          },
          result: [],
        };
      }

      return {
        EC: 0,
        EM: 'Get films by genre success',
        meta: {
          current: defaultPage,
          pageSize: defaultLimit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, films),
      };
    } catch (error) {
      console.error('Error in film service get films by genre:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get films by genre',
      });
    }
  }

  async findByType(typeValueEn: string, page: number, limit: number) {
    try {
      if (!typeValueEn || typeValueEn.trim() === '') {
        throw new BadRequestException({
          EC: 1,
          EM: 'Type value (valueEn) is required',
        });
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;
      const defaultPage = page ? page : 1;

      const allCodeRepository = this.filmsRepository.manager.getRepository('AllCode');
      const type = await allCodeRepository.findOne({
        where: {
          valueEn: typeValueEn,
          type: 'FILM_TYPE',
        },
      });

      const typeCode = type?.keyMap;

      if (!typeCode) {
        return {
          EC: 0,
          EM: `No type found with valueEn: ${typeValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: 0,
            total: 0,
          },
          result: [],
        };
      }

      const totalItems = await this.filmsRepository.count({
        where: {
          typeCode,
        },
      });

      const totalPages = Math.ceil(totalItems / defaultLimit);

      const queryBuilder = await this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      const films = await queryBuilder
        .where('film.typeCode = :typeCode', { typeCode })
        .andWhere('film.deletedAt IS NULL')
        .orderBy('film.createdAt', 'DESC')
        .skip(offset)
        .take(defaultLimit)
        .getMany();

      if (films.length === 0) {
        return {
          EC: 0,
          EM: `No films found for type: ${typeValueEn}`,
          meta: {
            current: defaultPage,
            pageSize: defaultLimit,
            pages: totalPages,
            total: totalItems,
          },
          result: [],
        };
      }

      return {
        EC: 0,
        EM: 'Get films by type success',
        meta: {
          current: defaultPage,
          pageSize: defaultLimit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, films),
      };
    } catch (error) {
      console.error('Error in film service get films by type:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get films by type',
      });
    }
  }

  async findWithFilters(
    filters: {
      country?: string;
      type?: string;
      age_code?: string;
      genre?: string;
      version?: string; // Language/version filter using langCode (e.g., Dubbed, Subtitled, Original)
      year?: string;
    },
    sort?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;
      const defaultPage = page ? page : 1;

      const queryBuilder = this.filmsRepository.createQueryBuilder('film');
      joinWithCommonFields(queryBuilder, 'film.language', 'language', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.age', 'age', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.type', 'type', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.country', 'country', allcodeCommonFields);
      joinWithCommonFields(queryBuilder, 'film.publicStatus', 'publicStatus', allcodeCommonFields);
      queryBuilder.leftJoinAndSelect('film.filmGenres', 'filmGenres');
      queryBuilder.leftJoinAndSelect('film.filmImages', 'filmImages');
      joinWithCommonFields(queryBuilder, 'filmGenres.genre', 'genre', allcodeCommonFields);

      // Base condition: not deleted
      queryBuilder.where('film.deletedAt IS NULL');

      // Filter by country - support comma-separated values, skip if 'All'
      if (
        filters.country &&
        filters.country.trim() !== '' &&
        filters.country.toLowerCase() !== 'all'
      ) {
        const countryList = filters.country
          .split(',')
          .map((c: string) => c.trim())
          .filter((c) => c.toLowerCase() !== 'all');
        const countryCodes: string[] = [];

        for (const countryValueEn of countryList) {
          const countryCode = await this.getAllCodeKeyMap(countryValueEn, 'COUNTRY');
          if (countryCode) {
            countryCodes.push(countryCode);
          }
        }

        if (countryCodes.length > 0) {
          queryBuilder.andWhere('film.countryCode IN (:...countryCodes)', { countryCodes });
        }
      }

      // Filter by type - support comma-separated values, skip if 'All'
      if (filters.type && filters.type.trim() !== '' && filters.type.toLowerCase() !== 'all') {
        const typeList = filters.type
          .split(',')
          .map((t: string) => t.trim())
          .filter((t) => t.toLowerCase() !== 'all');
        const typeCodes: string[] = [];

        for (const typeValueEn of typeList) {
          const typeCode = await this.getAllCodeKeyMap(typeValueEn, 'FILM_TYPE');
          if (typeCode) {
            typeCodes.push(typeCode);
          }
        }

        if (typeCodes.length > 0) {
          queryBuilder.andWhere('film.typeCode IN (:...typeCodes)', { typeCodes });
        }
      }

      // Filter by age rating - support comma-separated values, skip if 'All'
      if (
        filters.age_code &&
        filters.age_code.trim() !== '' &&
        filters.age_code.toLowerCase() !== 'all'
      ) {
        const ageList = filters.age_code
          .split(',')
          .map((a: string) => a.trim())
          .filter((a) => a.toLowerCase() !== 'all');
        const ageCodes: string[] = [];

        console.log('Age filter values received:', ageList);

        const allCodeRepo = this.filmsRepository.manager.getRepository('AllCode');
        for (const ageValue of ageList) {
          let ageCode: string | null = null;

          // If client passed a keyMap (e.g. R_T18), accept it directly when it exists
          if (/^[A-Z0-9_]+$/.test(ageValue)) {
            const ac = await allCodeRepo.findOne({ where: { keyMap: ageValue, type: 'RANK' } });
            if (ac) {
              ageCode = ac.keyMap;
            } else {
              // If client passed the short form (e.g. "T18"), try the prefixed keyMap ("R_T18")
              if (!ageValue.includes('_')) {
                const acPrefixed = await allCodeRepo.findOne({
                  where: { keyMap: `R_${ageValue}`, type: 'RANK' },
                });
                if (acPrefixed) {
                  ageCode = acPrefixed.keyMap;
                }
              }
            }
          }

          // Otherwise try lookup by valueEn (case-insensitive) or fallback to getAllCodeKeyMap
          if (!ageCode) {
            ageCode = await this.getAllCodeKeyMap(ageValue, 'RANK');
          }

          if (ageCode) {
            ageCodes.push(ageCode);
          }
        }

        if (ageCodes.length > 0) {
          queryBuilder.andWhere('film.ageCode IN (:...ageCodes)', { ageCodes });
        }
      }

      // Filter by genre(s) - support comma-separated values, skip if 'All'
      if (filters.genre && filters.genre.trim() !== '' && filters.genre.toLowerCase() !== 'all') {
        const genreList = filters.genre
          .split(',')
          .map((g: string) => g.trim())
          .filter((g) => g.toLowerCase() !== 'all');
        const genreCodes: string[] = [];

        for (const genreValueEn of genreList) {
          const genreCode = await this.getAllCodeKeyMap(genreValueEn, 'GENRE');
          if (genreCode) {
            genreCodes.push(genreCode);
          }
        }

        if (genreCodes.length > 0) {
          queryBuilder.andWhere('filmGenres.genreCode IN (:...genreCodes)', { genreCodes });
        }
      }

      // Filter by version/language - support comma-separated values, skip if 'All'
      if (
        filters.version &&
        filters.version.trim() !== '' &&
        filters.version.toLowerCase() !== 'all'
      ) {
        const versionList = filters.version
          .split(',')
          .map((v: string) => v.trim())
          .filter((v) => v.toLowerCase() !== 'all');
        const versionCodes: string[] = [];

        for (const versionValueEn of versionList) {
          const versionCode = await this.getAllCodeKeyMap(versionValueEn, 'VERSION');
          if (versionCode) {
            versionCodes.push(versionCode);
          }
        }

        if (versionCodes.length > 0) {
          queryBuilder.andWhere('film.langCode IN (:...versionCodes)', { versionCodes });
        }
      }

      // Filter by year - support single year, range (e.g., "2023" or "2020-2023"), or comma-separated years, skip if 'All'
      if (filters.year && filters.year.trim() !== '' && filters.year.toLowerCase() !== 'all') {
        const yearValue = filters.year.trim();

        // Check if it's a range (contains hyphen)
        if (yearValue.includes('-') && !yearValue.includes(',')) {
          const [startYear, endYear] = yearValue.split('-');
          queryBuilder.andWhere('film.year >= :startYear AND film.year <= :endYear', {
            startYear: parseInt(startYear.trim()),
            endYear: parseInt(endYear.trim()),
          });
        } else if (yearValue.includes(',')) {
          // Handle multiple comma-separated years
          const yearList = yearValue
            .split(',')
            .map((y: string) => y.trim())
            .filter((y) => y.toLowerCase() !== 'all');
          const years: number[] = [];

          for (const yearStr of yearList) {
            const year = parseInt(yearStr);
            if (!isNaN(year)) {
              years.push(year);
            }
          }

          if (years.length > 0) {
            queryBuilder.andWhere('film.year IN (:...years)', { years });
          }
        } else {
          // Single year
          const year = parseInt(yearValue);
          if (!isNaN(year)) {
            queryBuilder.andWhere('film.year = :year', { year });
          }
        }
      }

      // Apply sorting
      if (sort) {
        switch (sort.toLowerCase()) {
          case 'latest':
            queryBuilder.orderBy('film.createdAt', 'DESC');
            break;
          case 'imdb':
            // Use view count as fallback since imdbScore doesn't exist
            queryBuilder.orderBy('film.view', 'DESC');
            break;
          case 'views':
            queryBuilder.orderBy('film.view', 'DESC');
            break;
          case 'release_date':
            queryBuilder.orderBy('film.releaseDate', 'DESC');
            break;
          default:
            queryBuilder.orderBy('film.createdAt', 'DESC');
        }
      } else {
        queryBuilder.orderBy('film.createdAt', 'DESC');
      }

      // Get total count before pagination
      const totalItems = await queryBuilder.getCount();
      const totalPages = Math.ceil(totalItems / defaultLimit);

      // Apply pagination
      const films = await queryBuilder.skip(offset).take(defaultLimit).getMany();

      return {
        EC: 0,
        EM: 'Get films with filters success',
        meta: {
          current: defaultPage,
          pageSize: defaultLimit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, films),
      };
    } catch (error) {
      console.error('Error in film service get films with filters:', error);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service get films with filters',
      });
    }
  }

  async getAllCodeKeyMap(valueEn: string, type: string): Promise<string | null> {
    try {
      const allCodeRepository = this.filmsRepository.manager.getRepository('AllCode');

      // First try to find by keyMap (exact match)
      let allCode = await allCodeRepository
        .createQueryBuilder('allCode')
        .where('allCode.keyMap = :keyMap', { keyMap: valueEn })
        .andWhere('allCode.type = :type', { type })
        .getOne();

      // If not found by keyMap, try to find by valueEn (case-insensitive)
      if (!allCode) {
        allCode = await allCodeRepository
          .createQueryBuilder('allCode')
          .where('LOWER(allCode.valueEn) = LOWER(:valueEn)', { valueEn })
          .andWhere('allCode.type = :type', { type })
          .getOne();
      }

      return allCode?.keyMap || null;
    } catch (error) {
      console.log('Error in film service get all code key map: ', error || error);
      return null;
    }
  }

  async getFilmByGenreForChatBotData() {
    try {
      const dataRows = await this.filmGenreRepository.find({
        relations: [
          'film',
          'genre',
          'film.age',
          'film.type',
          'film.country',
          'film.language',
          'film.publicStatus',
        ],
      });
      const clean = (obj) =>
        _.omit(obj, [
          'createdAt',
          'updatedAt',
          'deletedAt',
          'createdById',
          'updatedById',
          'deletedById',
          'view',
          'age',
          'type',
          'country',
          'language',
          'publicStatus',
          'ageCode',
          'typeCode',
          'countryCode',
          'langCode',
          'publicStatusCode',
          'thumbUrl',
          'filmId',
        ]);

      const grouped = _(dataRows)
        .groupBy((item) => item.genre.valueVi)
        .map((films, genre) => ({
          genre,
          filmList: films.map((f) => {
            const film = instanceToPlain(f.film);

            return {
              ...clean(film),
              age: film.age?.valueVi,
              type: film.type?.valueVi,
              country: film.country?.valueVi,
              language: film.language?.valueVi,
              publicStatus: film.publicStatus?.valueVi,
            };
          }),
        }))
        .value();
      return {
        EC: 1,
        EM: 'Fetch film for chatbot data by genre sucess',
        result: instanceToPlain(grouped),
      };
    } catch (error) {
      console.log('Error in film service getFilmForChatBotData: ', error || error.message);
      return {
        EC: 0,
        EM: 'Error from film service getFilmForChatBotData',
      };
    }
  }

  async getFilmByCountryForChatBotData() {
    try {
      const dataRows = await this.filmsRepository.find({
        relations: [
          'filmGenres',
          'filmGenres.genre',
          'age',
          'type',
          'country',
          'language',
          'publicStatus',
        ],
      });
      const clean = (obj) =>
        _.omit(obj, [
          'createdAt',
          'updatedAt',
          'deletedAt',
          'createdById',
          'updatedById',
          'deletedById',
          'view',
          'age',
          'type',
          'country',
          'language',
          'publicStatus',
          'ageCode',
          'typeCode',
          'countryCode',
          'langCode',
          'publicStatusCode',
          'thumbUrl',
          'filmId',
          'filmGenres',
        ]);

      const grouped = _(dataRows)
        .groupBy((item) => item.country.valueVi)
        .map((films, country) => ({
          country,
          filmList: films.map((f) => {
            const film = instanceToPlain(f);
            const genres = film.filmGenres.map((g) => g.genre.valueVi);
            return {
              ...clean(film),
              genres: genres,
            };
          }),
        }))
        .value();
      return {
        EC: 1,
        EM: 'Fetch film for chatbot data by genre sucess',
        result: instanceToPlain(grouped),
      };
    } catch (error) {
      console.log('Error in film service getFilmForChatBotData: ', error || error.message);
      return {
        EC: 0,
        EM: 'Error from film service getFilmForChatBotData',
      };
    }
  }

  async getChartDataGenre() {
    try {
      const dataRaw = await this.filmsRepository.find({
        relations: ['filmGenres', 'filmGenres.genre'],
      });

      const grouped = {};

      dataRaw.forEach((item) => {
        item.filmGenres.forEach((fg) => {
          const key = fg.genre.valueVi;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });
      });

      const result = Object.keys(grouped).map((key) => ({
        name: key,
        value: grouped[key].length,
      }));

      return {
        EC: 0,
        EM: 'Get value chart genre success',
        result: instanceToPlain(result),
      };
    } catch (error) {
      console.log('Error in film service getChartDataGenre: ', error || error.message);
      return {
        EC: 0,
        EM: 'Error from film service getChartDataGenre',
      };
    }
  }

  async getChartDataAllCode(type: string) {
    try {
      const dataRaw = await this.filmsRepository.find({
        relations: [type],
      });

      const result = _(dataRaw)
        .groupBy((item) => item[type].valueVi)
        .map((arr, key) => ({ name: key, value: arr.length }))
        .value();

      return {
        EC: 0,
        EM: `Get value chart ${type} success`,
        result: instanceToPlain(result),
      };
    } catch (error) {
      console.log('Error in film service getChartDataAllCode: ', error || error.message);
      return {
        EC: 0,
        EM: 'Error from film service getChartDataAllCode',
      };
    }
  }
}
