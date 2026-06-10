import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { IUser } from '../users/interface/user.interface';
import { Film } from '../films/entities/film.entity';
import { User } from '../users/entities/user.entity';
import { RatingGateway } from './socket/rating-gateway';
import { NotificationsService } from '../notifications/notifications.service';
import aqp from 'api-query-params';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,

    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly ratingGateway: RatingGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createRating(dto: CreateRatingDto, user: IUser) {
    try {
      const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
      if (!film) return { EC: 0, EM: 'Film not found' };

      const existing = await this.ratingRepo
        .createQueryBuilder('rating')
        .withDeleted()
        .leftJoinAndSelect('rating.user', 'user')
        .leftJoinAndSelect('rating.film', 'film')
        .where('rating.userId = :userId', { userId: user.userId })
        .andWhere('rating.filmId = :filmId', { filmId: dto.filmId })
        .getOne();

      let result;
      let isUpdate = false;

      if (existing) {
        existing.ratingValue = dto.ratingValue;
        existing.content = dto.content || existing.content;
        existing.updatedBy = user.userId;

        if (existing.deletedAt) {
          existing.deletedAt = undefined;
          existing.deletedBy = undefined;
        }

        result = await this.ratingRepo.save(existing);
        isUpdate = true;
      } else {
        const newRating = this.ratingRepo.create({
          ratingValue: dto.ratingValue,
          content: dto.content,
          user: { userId: user.userId } as any,
          film: { filmId: dto.filmId } as any,
          createdBy: user.userId,
        });
        result = await this.ratingRepo.save(newRating);
      }

      const stats = await this.getRatingsByFilm(dto.filmId);
      this.ratingGateway.broadcastRatingUpdate({
        filmId: dto.filmId,
        averageRating: stats.result.averageRating,
        totalRatings: stats.result.totalRatings,
        newRating: {
          ratingId: result.ratingId,
          ratingValue: result.ratingValue,
          content: result.content,
          createdAt: result.createdAt,
          user: {
            id: user.userId,
            name: user.fullName,
          },
        },
      });

      return {
        EC: 1,
        EM: isUpdate ? 'Cập nhật đánh giá thành công' : 'Tạo đánh giá thành công',
        result,
      };
    } catch (error) {
      console.error('Error in createRating:', error);

      if (error.code === '23505') {
        return {
          EC: 0,
          EM: 'You have already rated this film. Please refresh the page to update your rating.',
        };
      }

      return { EC: 0, EM: 'Error creating rating: ' + error.message };
    }
  }

  async getRatingsByFilm(filmId: string) {
    const ratings = await this.ratingRepo.find({
      where: { film: { filmId }, isHidden: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const average =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length : 0;

    return {
      EC: 1,
      EM: 'Get ratings successfully',
      result: {
        averageRating: Number(average.toFixed(2)),
        totalRatings: ratings.length,
        list: ratings.map((r) => ({
          ratingId: r.ratingId,
          ratingValue: r.ratingValue,
          content: r.content,
          createdAt: r.createdAt,
          user: {
            id: r.user.userId,
            name: r.user.fullName,
            avatar: r.user.avatarUrl,
          },
        })),
      },
    };
  }

  async getEverage(filmId: string) {
    const ratings = await this.ratingRepo.find({
      where: {
        film: {
          filmId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
    const average =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length : 0;

    return { average: average };
  }

  async deleteRating(ratingId: string, user: IUser) {
    const rating = await this.ratingRepo.findOne({
      where: { ratingId },
      relations: ['user', 'film'],
    });
    if (!rating) return { EC: 0, EM: 'Rating not found' };

    if (rating.user.userId !== user.userId)
      return { EC: 0, EM: 'You are not allowed to delete this rating' };
    const filmId = rating.film.filmId;
    await this.ratingRepo.remove(rating);
    const stats = await this.getRatingsByFilm(filmId);
    this.ratingGateway.broadcastRatingDelete({
      filmId,
      ratingId,
    });
    this.ratingGateway.broadcastRatingUpdate({
      filmId,
      averageRating: stats.result.averageRating,
      totalRatings: stats.result.totalRatings,
    });

    return { EC: 1, EM: 'Xóa đánh giá thành công' };
  }

  async getAllRatings(query: any) {
    try {
      const { filter, sort } = aqp(query);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;
      if (filter.filmId) {
        filter.film = { filmId: filter.filmId };
        delete filter.filmId;
      }
      if (filter.userId) {
        filter.user = { userId: filter.userId };
        delete filter.userId;
      }

      const [data, total] = await this.ratingRepo.findAndCount({
        where: filter,
        relations: ['user', 'film'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return {
        EC: 1,
        EM: 'Get all ratings successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        ratings: data,
      };
    } catch (error) {
      console.error('Error in getAllRatings:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllRatings service',
      });
    }
  }

  async getStatistics() {
    try {
      const allRatings = await this.ratingRepo.find({
        relations: ['film'],
      });

      const total = allRatings.length;
      const hiddenCount = allRatings.filter((r) => r.isHidden).length;
      const visibleRatings = allRatings.filter((r) => !r.isHidden);
      const average =
        visibleRatings.length > 0
          ? visibleRatings.reduce((sum, r) => sum + r.ratingValue, 0) / visibleRatings.length
          : 0;

      const distribution = {
        '1': visibleRatings.filter((r) => r.ratingValue >= 1 && r.ratingValue < 2).length,
        '2': visibleRatings.filter((r) => r.ratingValue >= 2 && r.ratingValue < 3).length,
        '3': visibleRatings.filter((r) => r.ratingValue >= 3 && r.ratingValue < 4).length,
        '4': visibleRatings.filter((r) => r.ratingValue >= 4 && r.ratingValue < 5).length,
        '5': visibleRatings.filter((r) => r.ratingValue === 5).length,
      };

      const filmRatings = visibleRatings.reduce((acc, r) => {
        const filmId = r.film.filmId;
        if (!acc[filmId]) {
          acc[filmId] = {
            filmId,
            title: r.film.title,
            count: 0,
            sum: 0,
          };
        }
        acc[filmId].count++;
        acc[filmId].sum += r.ratingValue;
        return acc;
      }, {});

      const filmStats = Object.values(filmRatings).map((f: any) => ({
        filmId: f.filmId,
        title: f.title,
        averageRating: Number((f.sum / f.count).toFixed(2)),
        totalRatings: f.count,
      }));

      const topRated = [...filmStats]
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 10);
      const mostRated = [...filmStats].sort((a, b) => b.totalRatings - a.totalRatings).slice(0, 10);

      return {
        EC: 1,
        EM: 'Get statistics successfully',
        result: {
          totalRatings: visibleRatings.length,
          hiddenRatings: hiddenCount,
          averageRating: Number(average.toFixed(2)),
          distribution,
          topRated,
          mostRated,
        },
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getStatistics service',
      });
    }
  }

  async restoreRating(ratingId: string, user: IUser) {
    try {
      const rating = await this.ratingRepo.findOne({
        where: { ratingId },
        withDeleted: true,
        relations: ['film'],
      });

      if (!rating) {
        return { EC: 0, EM: 'Rating not found' };
      }

      if (!rating.deletedAt) {
        return { EC: 0, EM: 'Rating is not deleted' };
      }

      await this.ratingRepo.restore(ratingId);

      const filmId = rating.film.filmId;
      const stats = await this.getRatingsByFilm(filmId);
      this.ratingGateway.broadcastRatingUpdate({
        filmId,
        averageRating: stats.result.averageRating,
        totalRatings: stats.result.totalRatings,
      });

      return { EC: 1, EM: 'Rating restored successfully' };
    } catch (error) {
      console.error('Error in restoreRating:', error);
      throw new InternalServerErrorException('Error restoring rating');
    }
  }

  async hideRating(ratingId: string, userId: number) {
    try {
      const rating = await this.ratingRepo.findOne({
        where: { ratingId },
        relations: ['film'],
      });

      if (!rating) {
        return { EC: 0, EM: 'Rating not found' };
      }

      rating.isHidden = true;
      rating.updatedBy = userId;
      await this.ratingRepo.save(rating);

      this.ratingGateway.broadcastHideRating(ratingId, true, rating.film.filmId);

      return {
        EC: 1,
        EM: 'Hide rating successfully',
        result: rating,
      };
    } catch (error) {
      console.error('Error in hideRating:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from hideRating service',
      });
    }
  }

  async unhideRating(ratingId: string, userId: number) {
    try {
      const rating = await this.ratingRepo.findOne({
        where: { ratingId },
        relations: ['film'],
      });

      if (!rating) {
        return { EC: 0, EM: 'Rating not found' };
      }

      rating.isHidden = false;
      rating.updatedBy = userId;
      await this.ratingRepo.save(rating);

      this.ratingGateway.broadcastHideRating(ratingId, false, rating.film.filmId);

      return {
        EC: 1,
        EM: 'Unhide rating successfully',
        result: rating,
      };
    } catch (error) {
      console.error('Error in unhideRating:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from unhideRating service',
      });
    }
  }

  async hardDeleteRating(ratingId: string) {
    try {
      const rating = await this.ratingRepo.findOne({
        where: { ratingId },
        withDeleted: true,
        relations: ['film'],
      });

      if (!rating) {
        throw new NotFoundException('Rating not found');
      }

      const filmId = rating.film.filmId;
      await this.ratingRepo.remove(rating);

      const stats = await this.getRatingsByFilm(filmId);
      this.ratingGateway.broadcastRatingUpdate({
        filmId,
        averageRating: stats.result.averageRating,
        totalRatings: stats.result.totalRatings,
      });

      return {
        EC: 1,
        EM: 'Hard delete rating successfully',
      };
    } catch (error) {
      console.error('Error in hardDeleteRating:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from hardDeleteRating service',
      });
    }
  }
}
