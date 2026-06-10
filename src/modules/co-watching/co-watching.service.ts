import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isEmpty, isUUID } from 'class-validator';

import { RedisService } from '../redis/redis.service';
import { FilmsService } from '../films/films.service';
import { CreateCoWatchingDto } from './dto/create-co-watching.dto';
import { UpdateCoWatchingDto } from './dto/update-co-watching.dto';
import { CoWatchingRes, RoomPaginate } from './dto/co-watching-response.dto';
import { RoomCoWatching } from './entities/co-watching.entity';
import { IUser } from '../users/interface/user.interface';

@Injectable()
export class CoWatchingService {
  private readonly REDIS_TTL = 86400;
  private readonly REDIS_PREFIX = 'room:';

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(RoomCoWatching)
    private readonly coWatchingRepository: Repository<RoomCoWatching>,
    private readonly filmService: FilmsService,
  ) {}

  async create(createCoWatchingDto: CreateCoWatchingDto, user: IUser) {
    try {
      const hasLive = await this.coWatchingRepository.find({
        where: {
          hostId: user.userId,
          isLive: true,
        },
      });

      if (hasLive) {
        return {
          EC: 1,
          EM: 'Hãy đóng phòng live đang hoạt động trước khi tạo phòng live mới nhé!',
        };
      }

      const roomData = this.coWatchingRepository.create({
        ...createCoWatchingDto,
        hostId: user.userId,
      });
      const newRoom = await this.coWatchingRepository.save(roomData);

      const room = await this.coWatchingRepository.findOne({
        where: { roomId: newRoom.roomId },
        relations: ['host'],
      });
      const dataFilm = await this.filmService.findOne(newRoom.filmId);

      const data = {
        room: plainToInstance(CoWatchingRes, room, {
          excludeExtraneousValues: true,
        }),
        film: dataFilm.film,
      };

      await this.redisService.setJson(this.REDIS_PREFIX + newRoom.roomId, data, this.REDIS_TTL);

      return {
        EC: 0,
        EM: 'Create new room success',
        ...data,
      };
    } catch (error) {
      console.error(
        'Error in co-watching service create new room co_watching:',
        error || error.message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in co-watching service create new room co_watching ',
      });
    }
  }

  async findAll(page: number, limit: number, isMain: boolean, queryString: string) {
    try {
      const { filter, projection } = aqp(queryString);
      let { sort } = aqp(queryString);

      delete filter.current;
      delete filter.pageSize;
      delete filter.isMain;

      const host_id = filter.hostId;
      delete filter.hostId;

      const whereCondition: any = { ...filter };

      if (host_id) {
        if (isMain) {
          whereCondition.hostId = Not(host_id);
          whereCondition.isLive = true;
          whereCondition.isPrivate = false;
        } else {
          whereCondition.hostId = host_id;
        }
      }

      if (isEmpty(sort)) {
        sort = { createdAt: -1 };
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.coWatchingRepository.count({ where: whereCondition });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.coWatchingRepository.find({
        where: whereCondition,
        order: sort,
        skip: offset,
        take: defaultLimit,
        relations: ['film', 'host'],
      });

      return {
        EC: 0,
        EM: 'Get co_watching room with query paginate success',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        list: plainToInstance(RoomPaginate, result),
      };
    } catch (error) {
      console.error(
        'Error in co-watching service get list room co_watching:',
        error || error.message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in co-watching service get list room co_watching',
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

      const cacheKey = this.REDIS_PREFIX + id;
      const cached = await this.redisService.getJson<RoomCoWatching>(cacheKey);
      if (cached) {
        return {
          EC: 0,
          EM: 'Get room by id success (redis)',
          ...cached,
        };
      }

      const roomData = await this.coWatchingRepository.findOne({
        where: { roomId: id },
        relations: ['host'],
      });

      console.log('Check data detail: ', roomData);

      if (!roomData) {
        throw new NotFoundException({
          EC: 2,
          EM: `Cannot find room with id: ${id}`,
        });
      }

      const dataFilm = await this.filmService.findOne(roomData.filmId);

      const data = {
        room: plainToInstance(CoWatchingRes, roomData, {
          excludeExtraneousValues: true,
        }),
        film: dataFilm.film,
      };

      await this.redisService.setJson(cacheKey, data, this.REDIS_TTL);

      return {
        EC: 0,
        EM: 'Get room by id success',
        ...data,
      };
    } catch (error) {
      console.error(
        'Error in co-watching service get room co_watching by Id:',
        error || error.message,
      );
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in co-watching service get room co_watching by Id',
      });
    }
  }

  async update(roomId: string, updateCoWatchingDto: UpdateCoWatchingDto) {
    try {
      if (!isUUID(roomId)) {
        throw new BadRequestException({
          EC: 1,
          EM: `Invalid UUID format: ${roomId}`,
        });
      }
      const cacheKey = this.REDIS_PREFIX + roomId;

      await this.coWatchingRepository.update({ roomId }, updateCoWatchingDto);

      await this.redisService.del(cacheKey);

      const updatedRoom = await this.coWatchingRepository.findOneBy({ roomId });
      if (updatedRoom) {
        await this.redisService.setJson(cacheKey, updatedRoom, this.REDIS_TTL);
      }

      return {
        EC: 0,
        EM: 'Update live room success',
        ...updatedRoom,
      };
    } catch (error) {
      console.error(
        'Error in co-watching service update room co_watching by Id:',
        error || error.message,
      );
      throw new InternalServerErrorException({
        EC: 2,
        EM: 'Error in co-watching service update room co_watching by Id',
      });
    }
  }

  async remove(roomId: string) {
    try {
      if (!isUUID(roomId)) {
        throw new BadRequestException({
          EC: 1,
          EM: `Invalid UUID format: ${roomId}`,
        });
      }
      const cacheKey = this.REDIS_PREFIX + roomId;

      await this.redisService.del(cacheKey);
      await this.coWatchingRepository.softDelete(roomId);

      return { EC: 0, EM: 'Delet room success', deleted: 'success' };
    } catch (error) {
      console.log('Error in co-watching service delete room: ', error || error.message);
      throw new InternalServerErrorException({
        EC: 2,
        EM: 'Error in co-watching service delete room',
      });
    }
  }
}
