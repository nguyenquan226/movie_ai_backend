import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateFilmDirectorDto } from './dto/create-film_director.dto';
import { UpdateFilmDirectorDto } from './dto/update-film_director.dto';
import { FilmDirector } from './entities/film_director.entity';
import { Film } from '../films/entities/film.entity';
import { Director } from '../directors/entities/director.entity';
import { PaginationfdDto } from './dto/pagination-fd.dto';
import { IUser } from '../users/interface/user.interface';
import aqp from 'api-query-params';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ListFilm } from '../films/dto/list-film.dto';
import { FilmImage } from '../films/entities/film_image.entity';
import _ from 'lodash';

@Injectable()
export class FilmDirectorService {
  constructor(
    @InjectRepository(FilmDirector)
    private readonly filmDirectorRepo: Repository<FilmDirector>,
    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,
    @InjectRepository(Director)
    private readonly directorRepo: Repository<Director>,
  ) {}
  private formatFilmDirector(entity: any) {
    if (!entity) return null;

    const clean = (obj: any) =>
      Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v != null && v !== undefined && v !== ''),
      );

    const film = entity.film
      ? clean({
          filmId: entity.film.filmId,
          originalTitle: entity.film.originalTitle,
          title: entity.film.title,
          description: entity.film.description,
          releaseDate: entity.film.releaseDate,
          year: entity.film.year,
          thumbUrl: entity.film.thumbUrl,
          // posterUrl: entity.film.posterUrl,
          filmImages: entity.film.filmImages?.map((img: FilmImage) => ({
            filmImageId: img.id,
            imageUrl: img.url,
          })),
          slug: entity.film.slug,
          age: entity.film.ageCode,
          type: entity.film.typeCode,
          country: entity.film.countryCode,
          language: entity.film.langCode,
          publicStatus: entity.film.publicStatusCode,
        })
      : null;

    const director = entity.director
      ? clean({
          directorId: entity.director.directorId,
          directorName: entity.director.directorName,
          slug: entity.director.slug,
          birthDate: entity.director.birthDate,
          story: entity.director.story,
          avatarUrl: entity.director.avatarUrl,
          genderCode: entity.director.genderCodeRL?.keyMap,
          nationalityCode: entity.director.nationalityCodeRL?.keyMap,
        })
      : null;

    const { id, isMain, createdAt, updatedAt, createdBy, updatedBy } = entity;

    return clean({
      id,
      isMain,
      film,
      director,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    });
  }

  async createFilmDirector(dto: CreateFilmDirectorDto, user: IUser) {
    try {
      const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
      const director = await this.directorRepo.findOne({
        where: { directorId: dto.directorId },
        relations: ['genderCodeRL', 'nationalityCodeRL'],
      });

      if (!film || !director) {
        return { EC: 0, EM: 'Film or Director not found!' };
      }

      const exists = await this.filmDirectorRepo.findOne({
        where: { film: { filmId: dto.filmId }, director: { directorId: dto.directorId } },
      });
      if (exists) {
        return { EC: 0, EM: 'This director is already associated with this film!' };
      }
      if (dto.isMain) {
        const mainExists = await this.filmDirectorRepo.findOne({
          where: { film: { filmId: dto.filmId }, isMain: true },
        });
        if (mainExists) {
          return { EC: 0, EM: 'Main director already exists for this film!' };
        }
      }

      const newFilmDirector = this.filmDirectorRepo.create({
        film,
        director,
        isMain: dto.isMain || false,
        createdBy: user.userId,
      });

      const savedFilmDirector = await this.filmDirectorRepo.save(newFilmDirector);
      const result = this.formatFilmDirector(savedFilmDirector);

      return { EC: 1, EM: 'Create film director successfully', result };
    } catch (error: any) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createFilmDirector service',
      });
    }
  }

  async getAllFilmDirectors(query: PaginationfdDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sort = query.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const skip = (page - 1) * limit;

      const [data, total] = await this.filmDirectorRepo.findAndCount({
        relations: ['film', 'director'],
        order: { id: sort },
        skip,
        take: limit,
      });

      const result = data.map((fd) => ({
        id: fd.id,
        isMain: fd.isMain,
        film: fd.film
          ? {
              filmId: fd.film.filmId,
              title: fd.film.title,
              originalTitle: fd.film.originalTitle,
              description: fd.film.description,
              releaseDate: fd.film.releaseDate,
              thumbUrl: fd.film.thumbUrl,
              // posterUrl: fd.film.posterUrl,
              filmImages: fd.film.filmImages?.map((img: FilmImage) => ({
                filmImageId: img.id,
                imageUrl: img.url,
              })),
              year: fd.film.year,
              slug: fd.film.slug,
              age: fd.film.ageCode,
              type: fd.film.typeCode,
              country: fd.film.countryCode,
              language: fd.film.langCode,
              publicStatus: fd.film.publicStatusCode,
            }
          : null,
        director: fd.director
          ? {
              directorId: fd.director.directorId,
              directorName: fd.director.directorName,
              slug: fd.director.slug,
              birthDate: fd.director.birthDate,
              story: fd.director.story,
              avatarUrl: fd.director.avatarUrl,
              gender: fd.director.genderCode,
              nationality: fd.director.nationalityCode,
            }
          : null,
        createdAt: fd.createdAt,
        updatedAt: fd.updatedAt,
      }));

      return {
        EC: 1,
        EM:
          total > 0
            ? 'Get all film-director relations successfully'
            : 'No film-director relations found',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result,
      };
    } catch (error: any) {
      console.error('Error in getAllFilmDirectors:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllFilmDirectors service',
      });
    }
  }

  async getFilmDirectorById(id: number) {
    try {
      const filmDirector = await this.filmDirectorRepo.findOne({
        where: { id },
        relations: [
          'film',
          'film.filmImages',
          'director',
          'director.genderCodeRL',
          'director.nationalityCodeRL',
        ],
      });

      if (!filmDirector) return { EC: 0, EM: `FilmDirector ${id} not found!` };
      const result = this.formatFilmDirector(filmDirector);
      return { EC: 1, EM: 'Get filmDirector successfully', result };
    } catch (error: any) {
      console.error('Error in getFilmDirectorById:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmDirectorById service',
      });
    }
  }

  async getDirectorsByFilm(filmId: string, query: any = {}) {
    try {
      query = query || {};
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 5;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { directorName: 'ASC' };

      const film = await this.filmRepo.findOne({
        where: { filmId },
        relations: ['filmDirectors', 'filmDirectors.director'],
      });

      if (!film) {
        return { EC: 0, EM: `Film ${filmId} not found!` };
      }

      let directors = film.filmDirectors.map((fd) => ({
        directorId: fd.director.directorId,
        directorName: fd.director.directorName,
        birthDate: fd.director.birthDate,
        story: fd.director.story,
        slug: fd.director.slug,
        isMain: fd.isMain,
        genderCode: fd.director.genderCode,
        nationalityCode: fd.director.nationalityCode,
      }));

      if (order) {
        const [key, dir] = Object.entries(order)[0];
        const director = String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        directors = directors.sort((a, b) =>
          director === 'ASC' ? a[key]?.localeCompare(b[key]) : b[key]?.localeCompare(a[key]),
        );
      }

      const total = directors.length;
      const paginated = directors.slice(skip, skip + limit);

      return {
        EC: 0,
        EM: 'Get directors by film successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      };

      return { EC: 0, EM: 'Get directors by film successfully', directors };
    } catch (error: any) {
      console.error('Error in getDirectorsByFilm:', error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error from getDirectorsByFilm service',
      });
    }
  }
  async getFilmsByDirector(directorId: number, query: any = {}) {
    try {
      query = query || {};
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 12;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { createdAt: 'DESC' };

      const director = await this.directorRepo.findOne({
        where: { directorId },
        relations: [
          'filmDirectors',
          'filmDirectors.film',
          'filmDirectors.film.filmGenres',
          'filmDirectors.film.filmGenres.genre',
          'filmDirectors.film.filmImages',
          'filmDirectors.film.age',
        ],
      });

      if (!director) {
        return { EC: 0, EM: `Director ${directorId} not found!` };
      }

      const filmDataRaw = director.filmDirectors.map((i) => i.film);

      let films = plainToInstance(ListFilm, filmDataRaw);

      if (order) {
        const [key, dir] = Object.entries(order)[0];
        const direction = String(dir).toUpperCase();
        films = films.sort((a, b) =>
          direction === 'ASC'
            ? String(a[key])?.localeCompare(String(b[key]))
            : String(b[key])?.localeCompare(String(a[key])),
        );
      }

      const total = films.length;
      const paginated = films.slice(skip, skip + limit);

      return {
        EC: 1,
        EM: 'Get films by director successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      };
    } catch (error: any) {
      console.error('Error in getFilmsByDirector:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmsByDirector service',
      });
    }
  }

  async getFilmsByDirectorSlug(directorSlug: string, query: any = {}) {
    try {
      query = query || {};
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 12;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { createdAt: 'DESC' };

      const director = await this.directorRepo.findOne({
        where: { slug: directorSlug },
        relations: [
          'filmDirectors',
          'filmDirectors.film',
          'filmDirectors.film.filmGenres',
          'filmDirectors.film.filmGenres.genre',
          'filmDirectors.film.filmImages',
          'filmDirectors.film.age',
        ],
      });

      if (!director) {
        return { EC: 0, EM: `Director ${directorSlug} not found!` };
      }

      const filmDataRaw = director.filmDirectors.map((i) => i.film);

      let films = plainToInstance(ListFilm, filmDataRaw);

      if (order) {
        const [key, dir] = Object.entries(order)[0];
        const direction = String(dir).toUpperCase();
        films = films.sort((a, b) =>
          direction === 'ASC'
            ? String(a[key])?.localeCompare(String(b[key]))
            : String(b[key])?.localeCompare(String(a[key])),
        );
      }

      const total = films.length;
      const paginated = films.slice(skip, skip + limit);

      return {
        EC: 1,
        EM: 'Get films by director successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      };
    } catch (error: any) {
      console.error('Error in getFilmsByDirector:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmsByDirector service',
      });
    }
  }

  async updateFilmDirector(id: number, dto: UpdateFilmDirectorDto, user: IUser) {
    try {
      const relation = await this.filmDirectorRepo.findOne({
        where: { id },
        relations: ['film', 'director'],
        select: ['id', 'isMain'],
      });
      if (!relation) return { EC: 0, EM: `Relation ${id} not found!` };

      const targetFilmId = dto.filmId ?? relation.film.filmId;
      const targetDirectorId = dto.directorId ?? relation.director.directorId;

      const exists = await this.filmDirectorRepo.findOne({
        where: {
          film: { filmId: targetFilmId },
          director: { directorId: targetDirectorId },
          id: Not(id),
        },
      });
      if (exists) return { EC: 0, EM: 'This director is already associated with this film!' };

      if (dto.filmId) {
        const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
        if (!film) return { EC: 0, EM: `Film ${dto.filmId} is invalid!` };
        relation.film = film;
      }

      if (dto.directorId) {
        const director = await this.directorRepo.findOne({
          where: { directorId: dto.directorId },
        });
        if (!director) return { EC: 0, EM: `Director ${dto.directorId} is invalid!` };
        relation.director = director;
      }

      if (dto.isMain === true) {
        const mainExists = await this.filmDirectorRepo.findOne({
          where: {
            film: { filmId: targetFilmId },
            isMain: true,
            id: Not(id),
          },
          relations: ['film'],
        });
        if (mainExists) return { EC: 0, EM: 'Main director already exists for this film!' };
      }

      if (dto.isMain !== undefined) relation.isMain = dto.isMain;

      relation.updatedBy = user.userId;

      await this.filmDirectorRepo.save(relation);

      const data = await this.filmDirectorRepo.findOne({
        where: { id },
        relations: ['film', 'director', 'director.genderCodeRL', 'director.nationalityCodeRL'],
      });

      const result = this.formatFilmDirector(data);
      return { EC: 1, EM: 'Update film director successfully', result };
    } catch (error: any) {
      console.error('Error in updateFilmDirector:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateFilmDirector service',
      });
    }
  }

  async deleteFilmDirector(id: number, user: IUser) {
    try {
      const deleteFilmDirector = await this.filmDirectorRepo.findOne({ where: { id } });
      if (!deleteFilmDirector) return { EC: 0, EM: `FilmDirector ${id} not found!` };

      await this.filmDirectorRepo.update(id, { deletedBy: user.userId });
      await this.filmDirectorRepo.softDelete({ id });
      return { EC: 1, EM: 'Delete film director successfully' };
    } catch (error: any) {
      console.error('Error in deleteFilmDirector:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteFilmDirector service',
      });
    }
  }
  async groupFilmsByDirectorLodash() {
    try {
      const rows = await this.filmDirectorRepo.find({
        relations: [
          'film',
          'film.age',
          'film.type',
          'film.country',
          'film.language',
          'film.publicStatus',
          'director',
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
        ]);

      const result = _(rows)
        .groupBy((x) => x.director.directorName)
        .map((value, key) => ({
          director: key,

          filmList: value.map((v) => {
            const film = instanceToPlain(v.film);

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
        EM: 'Group films by director successfully',
        result,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error group films by director',
      });
    }
  }
}
