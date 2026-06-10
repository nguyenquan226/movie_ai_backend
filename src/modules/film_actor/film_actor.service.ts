import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { FilmActor } from './entities/film_actor.entity';
import { Film } from '../films/entities/film.entity';
import { Actor } from '../actor/entities/actor.entity';
import { CreateFilmActorDto } from './dto/create-film_actor.dto';
import { UpdateFilmActorDto } from './dto/update-film_actor.dto';
import aqp from 'api-query-params';
import { IUser } from '../users/interface/user.interface';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ListFilm } from '../films/dto/list-film.dto';
import { FilmImage } from '../films/entities/film_image.entity';
import _ from 'lodash';

@Injectable()
export class FilmActorService {
  constructor(
    @InjectRepository(FilmActor)
    private readonly filmActorRepo: Repository<FilmActor>,

    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,

    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>,
  ) {}

  private formatFilmActor(entity: any) {
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

    const actor = entity.actor
      ? clean({
          actorId: entity.actor.actorId,
          actorName: entity.actor.actorName,
          slug: entity.actor.slug,
          shortBio: entity.actor.shortBio,
          genderCode: entity.actor.genderActor?.keyMap,
          birthDate: entity.actor.birthDate,
          nationalityCode: entity.actor.nationalityActor?.keyMap,
          avatarUrl: entity.actor.avatarUrl,
        })
      : null;

    const { id, characterName, createdAt, updatedAt, createdBy, updatedBy } = entity;

    return clean({
      id,
      film,
      actor,
      characterName,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    });
  }
  async createFilmActor(dto: CreateFilmActorDto, user: IUser) {
    try {
      const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
      if (!film) return { EC: 0, EM: `Film ${dto.filmId} not found!` };

      const actor = await this.actorRepo.findOne({
        where: { actorId: dto.actorId },
        relations: ['genderActor', 'nationalityActor'],
      });
      if (!actor) return { EC: 0, EM: `Actor ${dto.actorId} not found!` };

      const exists = await this.filmActorRepo.findOne({
        where: { film: { filmId: dto.filmId }, actor: { actorId: dto.actorId } },
      });
      if (exists) return { EC: 0, EM: 'This actor is already assigned to this film!' };

      const filmActor = this.filmActorRepo.create({
        film,
        actor,
        characterName: dto.characterName,
        createdBy: user.userId,
      });

      const data = await this.filmActorRepo.save(filmActor);
      const result = this.formatFilmActor(data);

      return { EC: 1, EM: 'Create film-actor successfully', result };
    } catch (error: any) {
      console.error('Error in createFilmActor:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createFilmActor service',
      });
    }
  }
  async getAllFilmActors(query: any) {
    try {
      const { filter, sort } = aqp(query);
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 5;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      let sortOrder: 'ASC' | 'DESC' = 'ASC';
      if (query.sort && typeof query.sort === 'string') {
        const value = query.sort.toLowerCase();
        if (value === 'desc') sortOrder = 'DESC';
      }

      const [data, total] = await this.filmActorRepo.findAndCount({
        relations: ['film', 'actor'],
        where: filter,
        order: { id: sortOrder },
        skip,
        take: limit,
      });

      const result = data.map((fa) => ({
        id: fa.id,
        film: fa.film
          ? {
              filmId: fa.film.filmId,
              title: fa.film.title,
              // posterUrl: fa.film.posterUrl,
              filmImages: fa.film.filmImages?.map((img: FilmImage) => ({
                filmImageId: img.id,
                imageUrl: img.url,
              })),
              thumbUrl: fa.film.thumbUrl,
              description: fa.film.description,
              releaseDate: fa.film.releaseDate,
              year: fa.film.year,
              slug: fa.film.slug,
              age: fa.film.ageCode,
              type: fa.film.typeCode,
              country: fa.film.countryCode,
              language: fa.film.langCode,
              publicStatus: fa.film.publicStatusCode,
            }
          : null,
        actor: fa.actor
          ? {
              actorId: fa.actor.actorId,
              actorName: fa.actor.actorName,
              slug: fa.actor.slug,
              shortBio: fa.actor.shortBio,
              birthDate: fa.actor.birthDate,
              gender: fa.actor.genderCode,
              nationality: fa.actor.nationalityCode,
              avatarUrl: fa.actor.avatarUrl,
            }
          : null,
        characterName: fa.characterName,
        createdAt: fa.createdAt,
        updatedAt: fa.updatedAt,
      }));

      return {
        EC: 1,
        EM: total > 0 ? 'Get all film-actors successfully' : 'No film-actor records found',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result,
      };
    } catch (error: any) {
      console.error('Error in getAllFilmActors:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllFilmActors service',
      });
    }
  }

  async getFilmActorById(id: number) {
    try {
      const filmActor = await this.filmActorRepo.findOne({
        where: { id },
        relations: [
          'film',
          'film.filmImages',
          'actor',
          'actor.genderActor',
          'actor.nationalityActor',
        ],
      });
      if (!filmActor) return { EC: 0, EM: `Film-Actor ${id} not found!` };

      const result = this.formatFilmActor(filmActor);
      return { EC: 1, EM: 'Get film-actor successfully', result };
    } catch (error: any) {
      console.error('Error in getFilmActorById:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmActorById service',
      });
    }
  }
  async getActorsByFilm(filmId: string, query: any = {}) {
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

      const order = sort || { createdAt: 'ASC' };

      const [data, total] = await this.filmActorRepo.findAndCount({
        where: { film: { filmId }, ...filter },
        relations: ['actor'],
        order,
        skip,
        take: limit,
      });

      if (total === 0) {
        return {
          EC: 1,
          EM: 'No actors found for this film!',
          meta: { page, limit, total, totalPages: 0 },
          data: [],
        };
      }

      const actors = data.map((item) => ({
        actorId: item.actor.actorId,
        actorName: item.actor.actorName,
        birthDate: item.actor.birthDate,
        avatarUrl: item.actor.avatarUrl,
        slug: item.actor.slug,
        shortBio: item.actor.shortBio,
        nationalityCode: item.actor.nationalityCode,
        genderCode: item.actor.genderCode,
        characterName: item.characterName,
      }));

      return {
        EC: 0,
        EM: 'Get actors by film successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: actors,
      };
    } catch (error: any) {
      console.error('Error in getActorsByFilm:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getActorsByFilm service',
      });
    }
  }

  async getFilmsByActor(actorId: number, query: any = {}) {
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

      const [data, total] = await this.filmActorRepo.findAndCount({
        where: { actor: { actorId }, ...filter },
        relations: ['actor'],
        order,
        skip,
        take: limit,
      });

      if (total === 0) {
        return {
          EC: 1,
          EM: 'No films found for this actor!',
          meta: { page, limit, total, totalPages: 0 },
          data: [],
        };
      }

      const actor = await this.actorRepo.findOne({
        where: { actorId },
        relations: [
          'filmActors',
          'filmActors.film',
          'filmActors.film.filmGenres',
          'filmActors.film.filmGenres.genre',
          'filmActors.film.filmImages',
          'filmActors.film.age',
        ],
      });

      if (!actor) return { EC: 0, EM: `Actor ${actorId} not found!` };

      const filmDataRaw = actor.filmActors.map((i) => i.film);

      let films = plainToInstance(ListFilm, filmDataRaw);
      const paginated = films.slice(skip, skip + limit);
      return {
        EC: 1,
        EM: 'Get films by actor successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      };
    } catch (error) {
      console.error('Error in getFilmsByActor:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmsByActor service',
      });
    }
  }
  async getFilmsByActorSlug(slug: string, query: any = {}) {
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

      const [data, total] = await this.filmActorRepo.findAndCount({
        where: { actor: { slug }, ...filter },
        relations: ['actor'],
        order,
        skip,
        take: limit,
      });

      if (total === 0) {
        return {
          EC: 1,
          EM: 'No films found for this actor!',
          meta: { page, limit, total, totalPages: 0 },
          data: [],
        };
      }

      const actor = await this.actorRepo.findOne({
        where: { slug },
        relations: [
          'filmActors',
          'filmActors.film',
          'filmActors.film.filmGenres',
          'filmActors.film.filmGenres.genre',
          'filmActors.film.filmImages',
          'filmActors.film.age',
        ],
      });

      if (!actor) return { EC: 0, EM: `Actor ${slug} not found!` };

      const filmDataRaw = actor.filmActors.map((i) => i.film);

      let films = plainToInstance(ListFilm, filmDataRaw);
      const paginated = films.slice(skip, skip + limit);
      return {
        EC: 1,
        EM: 'Get films by actor successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      };
    } catch (error) {
      console.error('Error in getFilmsByActor:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getFilmsByActor service',
      });
    }
  }

  async updateFilmActor(id: number, dto: UpdateFilmActorDto, user: IUser) {
    try {
      const filmActor = await this.filmActorRepo.findOne({
        where: { id },
        relations: ['film', 'actor'],
      });
      if (!filmActor) return { EC: 0, EM: `Film-Actor ${id} not found!` };

      if (dto.filmId) {
        const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
        if (!film) return { EC: 0, EM: `Film ${dto.filmId} not found!` };
        filmActor.film = film;
      }

      if (dto.actorId) {
        const actor = await this.actorRepo.findOne({ where: { actorId: dto.actorId } });
        if (!actor) return { EC: 0, EM: `Actor ${dto.actorId} not found!` };
        filmActor.actor = actor;
      }

      if (dto.characterName) filmActor.characterName = dto.characterName;
      filmActor.updatedBy = user.userId;

      await this.filmActorRepo.save(filmActor);
      const datanew = await this.filmActorRepo.findOne({
        where: { id },
        relations: ['film', 'actor', 'actor.genderActor', 'actor.nationalityActor'],
      });
      const result = this.formatFilmActor(datanew);
      return { EC: 1, EM: 'Update film-actor successfully', result };
    } catch (error: any) {
      console.error('Error in updateFilmActor:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateFilmActor service',
      });
    }
  }

  async deleteFilmActorById(id: number, user: IUser) {
    try {
      const filmActor = await this.filmActorRepo.findOne({ where: { id } });
      if (!filmActor) return { EC: 0, EM: `Film-Actor ${id} not found!` };

      await this.filmActorRepo.update(id, { deletedBy: user.userId });
      await this.filmActorRepo.softDelete({ id });

      return { EC: 1, EM: 'Delete film-actor successfully' };
    } catch (error: any) {
      console.error('Error in deleteFilmActorById:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteFilmActorById service',
      });
    }
  }

  async groupFilmsByActorLodash() {
    try {
      const rows = await this.filmActorRepo.find({
        relations: [
          'film',
          'film.age',
          'film.type',
          'film.country',
          'film.language',
          'film.publicStatus',
          'actor',
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
        .groupBy((x) => x.actor.actorName)
        .map((value, key) => ({
          actor: key,
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
