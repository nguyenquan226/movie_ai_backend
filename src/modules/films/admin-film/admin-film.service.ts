import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Film } from '../entities/film.entity';
import { FilmGenre } from '../entities/film_genre.entity';
import { FilmImage } from '../entities/film_image.entity';
import { FilmDirector } from 'src/modules/film_director/entities/film_director.entity';
import { FilmProducer } from 'src/modules/film_producer/entities/film_producer.entity';
import { FilmActor } from 'src/modules/film_actor/entities/film_actor.entity';
import { FilmDirectorService } from 'src/modules/film_director/film_director.service';
import { FilmActorService } from 'src/modules/film_actor/film_actor.service';
import { FilmSearchService } from 'src/modules/search/filmSearch.service';
import { FilmProducerService } from 'src/modules/film_producer/film_producer.service';
import { RatingService } from 'src/modules/rating/rating.service';
import aqp from 'api-query-params';
import { isEmpty, isUUID } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FilmDeletedPaginationDto, FilmPaginationDto } from '../dto/film-admin.dto';
import { CreateFilmDto } from '../dto/create-film.dto';
import { IUser } from 'src/modules/users/interface/user.interface';
import { SlugUtil } from 'src/common/utils/slug.util';
import { UpdateFilmDto } from '../dto/update-film.dto';
import { count } from 'console';

@Injectable()
export class AdminFilmService {
  constructor(
    @InjectRepository(Film) private filmsRepository: Repository<Film>,
    @InjectRepository(FilmGenre) private filmGenreRepository: Repository<FilmGenre>,
    @InjectRepository(FilmImage) private filmImageRepository: Repository<FilmImage>,
    @InjectRepository(FilmDirector) private filmDirectorRepository: Repository<FilmDirector>,
    @InjectRepository(FilmProducer) private filmProducerRepository: Repository<FilmProducer>,
    @InjectRepository(FilmActor) private filmActorRepository: Repository<FilmActor>,
    private filmDirectorService: FilmDirectorService,
    private filmActorService: FilmActorService,
    private filmSearchService: FilmSearchService, //luong add
    private filmProducerService: FilmProducerService,
    private ratingService: RatingService,
  ) {}

  async create(createFilmDto: CreateFilmDto, user: IUser) {
    try {
      const filmGenres = createFilmDto.genreCodes.map((g: string) => ({ genreCode: g }));
      const slug = await SlugUtil.generateUniqueSlug(createFilmDto.slug, this.filmsRepository);
      const { directors, producers, actors, genreCodes, ...dataCreate } = createFilmDto;
      const newFilm = this.filmsRepository.create({
        ...dataCreate,
        slug,
        filmGenres,
        createdById: user.userId.toString(),
      });
      await this.filmsRepository.save(newFilm);
      await this.filmSearchService.indexFilm(newFilm); //luong add

      if (directors) {
        for (const director of directors) {
          await this.filmDirectorService.createFilmDirector(
            { ...director, filmId: newFilm.filmId },
            user,
          );
        }
      }

      if (producers) {
        for (const producer of producers) {
          await this.filmProducerService.createFilmProducer(
            { ...producer, filmId: newFilm.filmId },
            user,
          );
        }
      }

      if (actors) {
        for (const actor of actors) {
          await this.filmActorService.createFilmActor({ ...actor, filmId: newFilm.filmId }, user);
        }
      }

      return {
        EC: 0,
        EM: 'Tạo mới phim thành công',
        id: newFilm.filmId,
        createdAt: newFilm.createdAt,
      };
    } catch (error) {
      console.error('Error in film service create new film:', error || error.message);
      throw new InternalServerErrorException({
        EC: 5,
        EM: 'Error in film service create new film ',
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
          country: true,
          publicStatus: true,
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
        EM: 'Get film with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmPaginationDto, data),
      };
    } catch (error) {
      console.error('Error in film service get film paginate(admin):', error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service get film paginate',
      });
    }
  }

  async update(filmId: string, updateFilmDto: UpdateFilmDto, user: IUser) {
    try {
      if (!isUUID(filmId)) {
        throw new BadRequestException({
          EC: 1,
          EM: `Invalid UUID format: ${filmId}`,
        });
      }

      // Data Raw
      const filmDataRaw = await this.filmsRepository.findOne({
        where: { filmId },
        relations: ['filmGenres', 'filmImages'],
      });

      if (!filmDataRaw) {
        throw new NotFoundException({
          EC: 2,
          EM: `Film with id ${filmId} not found`,
        });
      }

      const { actors, directors, producers, filmImages, genreCodes, slug, ...otherFilmData } =
        updateFilmDto;

      // Handle Film_Genre
      let filmGenres: FilmGenre[] | undefined = undefined;
      if (genreCodes) {
        await this.filmGenreRepository.delete({ filmId });

        filmGenres = genreCodes.map((g: string) => {
          return this.filmGenreRepository.manager.create(FilmGenre, {
            genreCode: g,
            filmId,
          });
        });
      }

      this.filmsRepository.merge(filmDataRaw, otherFilmData);

      if (slug && slug !== '' && slug !== filmDataRaw.slug) {
        const newSlug = await SlugUtil.generateUniqueSlug(slug, this.filmsRepository);
        filmDataRaw.slug = newSlug;
      }

      if (filmGenres !== undefined) {
        filmDataRaw.filmGenres = filmGenres;
      }

      filmDataRaw.updatedById = user.userId.toString();
      await this.filmsRepository.save(filmDataRaw);
      await this.filmSearchService.updateFilmDocument(filmDataRaw); //luong add

      if (filmImages) {
        await this.updateFilmImage(filmId, filmImages);
      }

      if (directors) {
        const hasMain = directors.some((d) => d.isMain);
        if (!hasMain) {
          return {
            EC: 4,
            EM: 'Vui lòng chọn đạo diễn chính cho bộ phim',
          };
        }
        await this.updateFilmDirector(filmId, directors, user);
      }

      if (producers) {
        const hasMain = producers.some((d) => d.isMain);
        if (!hasMain) {
          return {
            EC: 5,
            EM: 'Vui lòng chọn nhà sản xuất chính cho bộ phim',
          };
        }
        await this.updateFilmProducer(filmId, producers, user);
      }

      if (actors) {
        const hasntCharacter = actors.some((d) => d.characterName === '');
        if (hasntCharacter) {
          return {
            EC: 6,
            EM: 'Vui lòng nhập tên nhân vật diễn viên đóng',
          };
        }

        await this.updateFilmActor(filmId, actors, user);
      }

      return {
        EC: 0,
        EM: 'Cập nhật phim thành công',
        message: 'Update Film successful',
        affectedRows: 1,
      };
    } catch (error) {
      console.log('Error in service update film: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 7,
        EM: 'Error in service update film',
      });
    }
  }

  async updateFilmImage(
    filmId: string,
    images: { type: 'poster' | 'horizontal' | 'backdrop'; url: string }[],
  ) {
    try {
      const existImages = await this.filmImageRepository.find({ where: { filmId } });

      for (const img of images) {
        const found = existImages.find((i) => i.type === img.type);
        if (found) {
          found.url = img.url;
          await this.filmImageRepository.save(found);
        } else {
          const newImg = this.filmImageRepository.create({ filmId, ...img });
          await this.filmImageRepository.save(newImg);
        }
      }
    } catch (error) {
      console.log('Error in film service update film image: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service update film image',
      });
    }
  }

  async updateFilmDirector(
    filmId: string,
    directors: { filmId?: string; directorId: number; isMain: boolean }[],
    user: IUser,
  ) {
    try {
      await this.filmDirectorRepository.delete({ film: { filmId } });
      for (const director of directors) {
        const response = await this.filmDirectorService.createFilmDirector(
          { ...director, filmId },
          user,
        );
        if (!response.EC) {
          return response;
        }
      }
    } catch (error) {
      console.log('Error in film service update film director: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service update film director',
      });
    }
  }

  async updateFilmProducer(
    filmId: string,
    producers: { filmId?: string; producerId: number; isMain: boolean }[],
    user: IUser,
  ) {
    try {
      await this.filmProducerRepository.delete({ film: { filmId } });
      for (const producer of producers) {
        const response = await this.filmProducerService.createFilmProducer(
          { ...producer, filmId },
          user,
        );
        if (!response.EC) {
          return response;
        }
      }
    } catch (error) {
      console.log('Error in film service update film producer: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service update film producer',
      });
    }
  }

  async updateFilmActor(
    filmId: string,
    actors: { filmId?: string; actorId: number; characterName: string }[],
    user: IUser,
  ) {
    try {
      await this.filmActorRepository.delete({ film: { filmId } });
      for (const actor of actors) {
        const response = await this.filmActorService.createFilmActor({ ...actor, filmId }, user);
        if (!response.EC) {
          return response;
        }
      }
    } catch (error) {
      console.log('Error in film service update film actor: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service update film actor',
      });
    }
  }

  async remove(filmId: string, user: IUser) {
    try {
      if (!isUUID(filmId)) {
        throw new BadRequestException({
          EC: 1,
          EM: `Invalid UUID format: ${filmId}`,
          id: filmId,
          deleted: false,
        });
      }
      const isExist = await this.filmsRepository.exists({ where: { filmId } });
      if (!isExist) {
        throw new NotFoundException({
          EC: 2,
          EM: `Film with filmId ${filmId} not found`,
          id: filmId,
          deleted: false,
        });
      }
      await this.filmsRepository.update(filmId, { deletedById: user.userId.toString() });
      await this.filmsRepository.softDelete(filmId);
      await this.filmSearchService.removeFilmFromIndex(filmId); //luong add

      return {
        EC: 0,
        EM: 'Xóa phim thành công',
        id: filmId,
        deleted: true,
      };
    } catch (error) {
      console.log('Error in film service delete film: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service delete film',
        id: filmId,
        deleted: false,
      });
    }
  }

  async bulkRemove(filmIds: string[], user: IUser) {
    try {
      const invalidIds = filmIds.filter((id) => !isUUID(id));
      if (invalidIds.length > 0) {
        return {
          EC: 1,
          EM: `Invalid UUID format for: ${invalidIds.join(', ')}`,
          deletedCount: 0,
          deletedIds: [],
          deleted: false,
        };
      }

      const existingFilms = await this.filmsRepository
        .createQueryBuilder('film')
        .withDeleted()
        .where('film.filmId IN (:...filmIds)', { filmIds })
        .select('film.filmId')
        .getMany();

      const existingIds = existingFilms.map((film) => film.filmId);
      const notfoundIds = filmIds.filter((id) => !existingIds.includes(id));

      if (notfoundIds.length > 0) {
        return {
          EC: 2,
          EM: `Films not found: ${notfoundIds.join(', ')}`,
          deletedCount: 0,
          deletedIds: [],
          deleted: false,
        };
      }

      await this.filmsRepository.update(filmIds, { deletedById: user.userId.toString() });
      await this.filmsRepository.softDelete(filmIds);
      await filmIds.forEach(async (filmId) => {
        await this.filmSearchService.removeFilmFromIndex(filmId);
      });

      return {
        EC: 0,
        EM: 'Xóa danh sách phim thành công',
        deletedCount: filmIds.length,
        deletedIds: filmIds,
        deleted: true,
      };
    } catch (error) {
      console.log('Error in film service bulk remove film: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service bulk remove film',
        deleted: false,
      });
    }
  }

  async hardDelete(filmId: string) {
    try {
      if (!isUUID(filmId)) {
        return {
          EC: 1,
          EM: `Invalid UUID format: ${filmId}`,
          id: filmId,
          deleted: false,
        };
      }

      const isExist = await this.filmsRepository
        .createQueryBuilder('film')
        .withDeleted()
        .getExists();

      if (!isExist) {
        return {
          EC: 2,
          EM: `Film with filmId ${filmId} not found`,
          id: filmId,
          deleted: false,
        };
      }

      await this.filmsRepository.delete({ filmId: filmId });
      await this.filmSearchService.removeFilmFromIndex(filmId);

      return {
        EC: 0,
        EM: 'Xóa thông tin phim vĩnh viễn',
        deleted: true,
      };
    } catch (error) {
      console.log('Error in film service hard delete film: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service hard delete film',
      });
    }
  }

  async hardDeleteList(filmIds: string[]) {
    try {
      const invalidIds = filmIds.filter((id) => !isUUID(id));
      if (invalidIds.length > 0) {
        return {
          EC: 1,
          EM: `Invalid UUID format for: ${invalidIds.join(', ')}`,
          deletedCount: 0,
          deletedIds: [],
          deleted: false,
        };
      }

      const existingFilms = await this.filmsRepository
        .createQueryBuilder('film')
        .withDeleted()
        .where('film.filmId IN (:...filmIds)', { filmIds })
        .select('film.filmId')
        .getMany();

      const existingIds = existingFilms.map((film) => film.filmId);
      const notfoundIds = filmIds.filter((id) => !existingIds.includes(id));

      if (notfoundIds.length > 0) {
        return {
          EC: 2,
          EM: `Films not found: ${notfoundIds.join(', ')}`,
          deletedCount: 0,
          deletedIds: [],
          deleted: false,
        };
      }

      await this.filmsRepository.delete(filmIds);
      await filmIds.forEach(async (filmId) => {
        await this.filmSearchService.removeFilmFromIndex(filmId);
      });

      return {
        EC: 0,
        EM: 'Xóa thông tin phim vĩnh viễn thành công',
        deletedCount: filmIds.length,
        deletedIds: filmIds,
        deleted: true,
      };
    } catch (error) {
      console.log('Error in film service hard delete list film: ', error?.message || error);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service hard delete list film',
      });
    }
  }

  async restoreFilm(filmId: string) {
    try {
      if (!isUUID(filmId)) {
        return {
          EC: 1,
          EM: `Invalid UUID format: ${filmId}`,
          id: filmId,
          restore: false,
        };
      }

      const isExistFilm = await this.filmsRepository
        .createQueryBuilder('film')
        .withDeleted()
        .where('film.filmId = :filmId', { filmId })
        .getOne();

      if (!isExistFilm) {
        return {
          EC: 2,
          EM: `Film with filmId ${filmId} not found`,
          id: filmId,
          restore: false,
        };
      }

      await this.filmsRepository.restore({ filmId: filmId });
      await this.filmSearchService.indexFilm(isExistFilm);

      return {
        EC: 0,
        EM: 'Khôi phục thông tin phim thành công',
        restore: true,
      };
    } catch (error) {
      console.log('Error in film service restore film: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service restore film',
      });
    }
  }

  async restoreListFilm(filmIds: string[]) {
    try {
      const invalidIds = filmIds.filter((id) => !isUUID(id));
      if (invalidIds.length > 0) {
        return {
          EC: 1,
          EM: `Invalid UUID format for: ${invalidIds.join(', ')}`,
          restoredCount: 0,
          restoredIds: [],
          restore: false,
        };
      }

      const existingFilms = await this.filmsRepository
        .createQueryBuilder('film')
        .withDeleted()
        .where('film.filmId IN (:...filmIds)', { filmIds })
        .select('film.filmId')
        .getMany();

      const existingIds = existingFilms.map((film) => film.filmId);
      const notfoundIds = filmIds.filter((id) => !existingIds.includes(id));

      if (notfoundIds.length > 0) {
        return {
          EC: 2,
          EM: `Films not found: ${notfoundIds.join(', ')}`,
          restoredCount: 0,
          restoredIds: [],
          restore: false,
        };
      }

      await this.filmsRepository.restore(filmIds);
      await this.filmsRepository
        .createQueryBuilder()
        .update()
        .set({ deletedById: () => 'NULL' })
        .where('filmId IN (:...filmIds)', { filmIds })
        .execute();

      await existingFilms.forEach(async (film) => {
        await this.filmSearchService.indexFilm(film);
      });

      return {
        EC: 0,
        EM: 'Khôi phục thông tin phim thành công',
        restoredCount: filmIds.length,
        restoredIds: filmIds,
        restore: true,
      };
    } catch (error) {
      console.log('Error in film service restore list film: ', error?.message || error);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in film service restore list film',
      });
    }
  }

  async getAllFilmDeleted(page: number, limit: number, queryString: string) {
    try {
      const { filter, projection } = aqp(queryString);
      let { sort } = aqp(queryString);

      delete filter.current;
      delete filter.pageSize;
      delete filter.deletedAt;

      if (isEmpty(sort)) {
        sort = { createdAt: -1 };
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.filmsRepository.count({
        withDeleted: true,
        where: { ...filter, deletedAt: Not(IsNull()) },
      });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.filmsRepository.find({
        withDeleted: true,
        where: {
          ...filter,
          deletedAt: Not(IsNull()),
        },
        order: sort,
        select: projection,
        relations: {
          language: true,
          country: true,
          publicStatus: true,
          deletedBy: true,
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
        EM: 'Get film deleted with query paginate success',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(FilmDeletedPaginationDto, data),
      };
    } catch (error) {
      console.log('Error in film service get film deleted: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in film service get film deleted',
      });
    }
  }
}
