import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Film } from '../films/entities/film.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favRepo: Repository<Favorite>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Film)
    private filmRepo: Repository<Film>,
  ) {}

  async toggleFavorite(userId: number, filmId: string) {
    try {
      const user = await this.userRepo.findOne({ where: { userId } });
      const film = await this.filmRepo.findOne({ where: { filmId } });
      if (!user || !film) {
        return {
          EC: 0,
          EM: 'Bad request',
        };
      }

      const existing = await this.favRepo.findOne({
        where: { user: { userId }, film: { filmId } },
      });

      if (existing) {
        await this.favRepo.remove(existing);
        return {
          EC: 1,
          EM: 'remove favorite film sucess',
          isFavorite: false,
        };
      }

      const newFav = this.favRepo.create({ user, film });
      await this.favRepo.save(newFav);

      return {
        EC: 1,
        EM: 'Add favorite film sucess',
        isFavorite: true,
      };
    } catch (error) {
      console.log('Error from toggle favorite film service: ', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from toggle film favorite',
      });
    }
  }

  async getAdocumentbyId(id: string) {
    try {
      const res = await this.favRepo.findOne({
        where: { favId: id },
        relations: {
          film: true,
        },
      });

      return {
        EC: 1,
        EM: 'Get a fav row suceess',
        favRow: res,
      };
    } catch (error) {
      console.log('Error from getAdocumentbyId film service: ', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from toggle film getAdocumentbyId',
      });
    }
  }

  async getUserFavoriteFilmList(userId: number) {
    try {
      const favorites = await this.favRepo.find({
        where: { userId: userId },
        relations: ['film'],
        order: {
          createdAt: 'DESC',
        },
      });

      const result = favorites.map((favorite) => {
        let film = favorite.film;
        return {
          filmId: film.filmId,
          title: film.title,
          originalTitle: film.originalTitle,
          thumbUrl: film.thumbUrl,
          slug: film.slug,
        };
      });

      return {
        EC: 1,
        EM: 'Get a list favorite films',
        favorites: result,
      };
    } catch (error) {
      console.log('Error from getUserFavoriteFilmList film service: ', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from toggle film getUserFavoriteFilmList',
      });
    }
  }
}
