import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producer } from './entities/producer.entity';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { IUser } from '../users/interface/user.interface';
import aqp from 'api-query-params';
import { Film } from 'src/modules/films/entities/film.entity';
import { FilmProducer } from 'src/modules/film_producer/entities/film_producer.entity';
import { ProducerSearchService } from '../search/producerSearch.service';
import { ActorSearchService } from '../search/actorSearch.service';

@Injectable()
export class ProducerService {
  constructor(
    @InjectRepository(Producer)
    private readonly producerRepo: Repository<Producer>,
    @InjectRepository(FilmProducer)
    private readonly filmProducerRepo: Repository<FilmProducer>,
    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,

    private searchService: ProducerSearchService,
    private commonSearchService: ActorSearchService,
  ) {}

  async createProducer(dto: CreateProducerDto, user: IUser): Promise<any> {
    try {
      if (!dto.producerName?.trim()) {
        return { EC: 0, EM: 'Producer name is required!' };
      }

      const exists = await this.producerRepo.findOne({
        where: { producerName: dto.producerName },
      });
      if (exists) return { EC: 0, EM: 'Producer name already exists!' };

      const slug = dto.producerName.toLowerCase().replace(/\s+/g, '-');

      const producer = this.producerRepo.create({
        producerName: dto.producerName,
        slug: slug,
        createdBy: user.userId,
      });

      const data = await this.producerRepo.save(producer);
      // search
      await this.searchService.indexProducer(producer);
      // search
      return {
        EC: 1,
        EM: 'Create producer successfully',
        ...data,
      };
    } catch (error: any) {
      console.error('Error in createProducer:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createProducer service',
      });
    }
  }

  async getAll() {
    try {
      return await this.producerRepo.find();
    } catch (error) {
      console.error('Error in get all producer:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from producer service',
      });
    }
  }

  async getAllProducers(query: any): Promise<any> {
    try {
      const { filter, sort } = aqp(query);
      const page = query.page || 1;
      const limit = query.limit || 5;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { producerId: 'ASC' };

      const [data, total] = await this.producerRepo.findAndCount({
        where: filter,
        order,
        skip,
        take: limit,
      });

      if (total === 0)
        return {
          EC: 1,
          EM: 'No producers found!',
          meta: { page, limit, total, totalPages: 0 },
        };

      const producers = data.map((d) => {
        const slug = d.slug;
        const { createdAt, updatedAt, createdBy, ...newData } = d as any;
        return Object.fromEntries(
          Object.entries({
            ...newData,
            slug,
          }).filter(([_, v]) => v !== null),
        );
      });

      return {
        EC: 1,
        EM: 'Get all producers successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        producers,
      };
    } catch (error: any) {
      console.error('Error in getAllProducers:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllProducers service',
      });
    }
  }

  async getProducerById(id: number): Promise<any> {
    try {
      const producer = await this.producerRepo.findOne({
        where: { producerId: id },
      });

      if (!producer) return { EC: 0, EM: `Producer ${id} not found!` };

      const { createdAt, updatedAt, createdBy, ...newData } = producer as any;
      Object.entries(newData)
        .filter(([_, v]) => v === null || v === undefined)
        .forEach(([k]) => delete newData[k]);

      return {
        EC: 1,
        EM: 'Get producer successfully',
        ...newData,
      };
    } catch (error: any) {
      console.error('Error in getProducerById:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getProducerById service',
      });
    }
  }

  async updateProducer(id: number, dto: UpdateProducerDto, user: IUser): Promise<any> {
    try {
      const producer = await this.producerRepo.findOne({
        where: { producerId: id },
      });

      if (!producer) return { EC: 0, EM: `Producer ${id} not found!` };

      if (dto.producerName) {
        const exists = await this.producerRepo.findOne({
          where: { producerName: dto.producerName },
        });
        if (exists && exists.producerId !== id)
          return { EC: 0, EM: 'Producer name already exists!' };

        producer.producerName = dto.producerName;
        producer.slug = dto.producerName.toLowerCase().replace(/\s+/g, '-');
      }

      producer.updatedBy = user.userId;
      const data = await this.producerRepo.save(producer);
      // search
      await this.commonSearchService.updateDocument(data.producerId.toString(), data, 'producers');
      // search
      return {
        EC: 1,
        EM: 'Update producer successfully',
        ...data,
      };
    } catch (error: any) {
      console.error('Error in updateProducer:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateProducer service',
      });
    }
  }

  async deleteProducerById(producerId: number, newProducerId?: number, user?: IUser): Promise<any> {
    try {
      const producer = await this.producerRepo.findOne({
        where: { producerId },
      });
      if (!producer) return { EC: 0, EM: `Producer ${producerId} not found!` };

      // If newProducerId provided, reassign all films from deleted producer to new producer
      if (newProducerId && newProducerId !== producerId) {
        const targetProducer = await this.producerRepo.findOne({
          where: { producerId: newProducerId },
        });
        if (!targetProducer) return { EC: 0, EM: `Target producer ${newProducerId} not found!` };

        // Get all film_producer records for this producer
        const filmProducers = await this.filmProducerRepo.find({
          where: { producer: { producerId } },
          relations: ['film', 'producer'],
        });

        // Update each film_producer relation to point to new producer
        for (const fp of filmProducers) {
          fp.producer = targetProducer;
          if (user) {
            fp.updatedBy = user.userId;
          }
          await this.filmProducerRepo.save(fp);
        }
      }

      if (user) {
        producer.deletedBy = user.userId;
        await this.producerRepo.save(producer);
      }

      await this.producerRepo.softDelete({ producerId });

      return { EC: 1, EM: 'Delete producer successfully' };
    } catch (error: any) {
      console.error('Error in deleteProducerById:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteProducerById service',
      });
    }
  }
}
