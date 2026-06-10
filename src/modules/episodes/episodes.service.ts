import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { IUser } from '../users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Episode } from './entities/episode.entity';
import { Repository } from 'typeorm';
import { Part } from '../parts/entities/part.entity';
import { isEmpty, isUUID } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EpisodeFindOne } from './dto/episode-response.dto';
import aqp from 'api-query-params';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectRepository(Episode) private episodeRepository: Repository<Episode>,
    @InjectRepository(Part) private partRepository: Repository<Part>,
  ) {}

  async createListEpisode(createListEpisodeDto: CreateEpisodeDto[], user: IUser) {
    try {
      for (const item of createListEpisodeDto) {
        await this.create(item, user);
      }

      return { EC: 0, EM: 'Create List Episode Success' };
    } catch (error) {
      console.error('Error in episode service create list episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in episode service create list episode',
      });
    }
  }

  async create(createEpisodeDto: CreateEpisodeDto, user: IUser) {
    try {
      const partIsExist = await this.partRepository.exists({
        where: { id: createEpisodeDto.partId },
      });

      if (!partIsExist) {
        return {
          EC: 1,
          EM: `Part with id ${createEpisodeDto.partId} not found`,
        };
      }

      const episodeNumber = await this.episodeRepository.count({
        where: { partId: createEpisodeDto.partId },
      });

      console.log('Check episode number: ', episodeNumber);

      if (!createEpisodeDto.title) {
        createEpisodeDto.title = `Tập ${episodeNumber + 1}`;
      }

      const newEpisode = this.episodeRepository.create({
        ...createEpisodeDto,
        episodeNumber: episodeNumber + 1,
        createdBy: user.userId.toString(),
      });
      await this.episodeRepository.save(newEpisode);
      return {
        EC: 0,
        EM: 'Tạo tập mới thành công',
        id: newEpisode.id,
        createdAt: newEpisode.createdAt,
      };
    } catch (error) {
      console.error('Error in episode service create new episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in episode service create new episode',
      });
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, projection } = aqp(qs);
      let { sort } = aqp(qs);

      delete filter.current;
      delete filter.pageSize;

      if (isEmpty(sort)) {
        sort = { episodeNumber: 1 };
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.episodeRepository.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.episodeRepository.find({
        where: filter,
        order: sort,
        select: projection,
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get all data episode',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(EpisodeFindOne, result),
      };
    } catch (error) {
      console.error('Error in episode service find all episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in episode service find all episode',
      });
    }
  }

  async findOneOption(query: string, type: keyof Episode) {
    try {
      const episode = await this.episodeRepository.findOne({
        where: { [type]: query },
        relations: ['part'],
      });
      if (!episode) {
        throw new NotFoundException({ EC: 2, EM: `Episode with ${type}: ${query} not found` });
      }

      return {
        EC: 0,
        EM: 'Get data episode success',
        ...plainToInstance(EpisodeFindOne, episode),
      };
    } catch (error) {
      console.error('Error in episode service find one episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in episode service find one episode',
      });
    }
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException({ EC: 1, EM: 'Wrong format episode id!' });
    }

    return this.findOneOption(id, 'id');
  }

  async findOneBySlug(slug: string) {
    return this.findOneOption(slug, 'slug');
  }

  async update(id: string, updateEpisodeDto: UpdateEpisodeDto, user: IUser) {
    try {
      if (!isUUID(id)) {
        return { EC: 1, EM: 'Wrong format episode id!' };
      }

      const episodeData = await this.episodeRepository.findOneBy({ id });
      if (!episodeData) {
        return { EC: 2, EM: `Episode with id: ${id} not found` };
      }

      Object.assign(episodeData, updateEpisodeDto);
      episodeData.updatedBy = user.userId.toString();

      await this.episodeRepository.save(episodeData);
      return {
        EC: 0,
        EM: 'Cập nhật tập phim thành công',
        message: 'Update Episode success',
        affectedRows: 1,
      };
    } catch (error) {
      console.error('Error in episode service update episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in episode service update episode',
      });
    }
  }

  async remove(id: string, user: IUser) {
    try {
      if (!isUUID(id)) {
        throw new BadRequestException({ EC: 1, EM: `Wrong format episode id!` });
      }

      const episodeIsExist = await this.episodeRepository.exists({ where: { id } });
      if (!episodeIsExist) {
        throw new NotFoundException({ EC: 2, EM: `Episode with id ${id} not found` });
      }

      await this.episodeRepository.update(id, { deletedBy: user.userId.toString() });
      await this.episodeRepository.softDelete(id);

      return { EC: 0, EM: 'Xóa tập phim thành công', deleted: 'success' };
    } catch (error) {
      console.error('Error in episode service delete episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 3,
        EM: 'Error in episode service delete episode',
      });
    }
  }

  async removeEpisodeByPart(partId: string, user: IUser) {
    try {
      await this.episodeRepository.update({ partId }, { deletedBy: user.userId.toString() });
      await this.episodeRepository.softDelete({ partId });

      return { EC: 0, EM: 'Delete episode by part id success' };
    } catch (error) {
      console.error('Error in episode service delete episode:', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in episode service delete episode',
      });
    }
  }
}
