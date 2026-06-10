import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor } from './entities/actor.entity';
import { AllCode } from '../all-codes/entities/all-code.entity';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import aqp from 'api-query-params';
import { IUser } from '../users/interface/user.interface';
import { SlugUtil } from '../../common/utils/slug.util';
import { ActorSearchService } from '../search/actorSearch.service';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>,

    @InjectRepository(AllCode)
    private readonly allcodeRepo: Repository<AllCode>,

    private searchService: ActorSearchService,
  ) {}

  async createListActor(listData: CreateActorDto[], user: IUser) {
    try {
      for (const item of listData) {
        await this.createActor(item, user);
      }

      return { EC: 0, EM: 'Create List Actor Success' };
    } catch (error) {
      console.error('Error in actor service create list actor:', error || error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in actor service create list actor',
      });
    }
  }

  async createActor(dto: CreateActorDto, user: IUser): Promise<any> {
    try {
      const gender = await this.allcodeRepo.findOne({
        where: { keyMap: dto.genderCode, type: 'GENDER' },
      });
      if (!gender) return { EC: 0, EM: `${dto.genderCode} is not valid!` };

      const nationality = await this.allcodeRepo.findOne({
        where: { keyMap: dto.nationalityCode, type: 'COUNTRY' },
      });
      if (!nationality) return { EC: 0, EM: `Nationality ${dto.nationalityCode} is not valid!` };

      if (!dto.actorName || dto.actorName.trim() === '')
        return { EC: 0, EM: 'Actor name is required!' };

      const baseSlug = SlugUtil.slugifyVietnamese(dto.actorName);
      const slug = await SlugUtil.generateUniqueSlug(baseSlug, this.actorRepo);
      const actor = this.actorRepo.create({
        actorName: dto.actorName,
        slug,
        shortBio: dto.shortBio,
        genderActor: gender,
        avatarUrl: dto.avatarUrl,
        birthDate: dto.birthDate,
        nationalityActor: nationality,
        createdBy: user.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const data = await this.actorRepo.save(actor);

      // search
      await this.searchService.indexActor(actor);
      // search

      const result = Object.fromEntries(
        Object.entries(data)
          .map(([k, v]) =>
            typeof v === 'object' && v !== null && 'keyMap' in v
              ? [
                  k,
                  {
                    keyMap: (v as any).keyMap,
                    type: (v as any).type,
                    valueEn: (v as any).valueEn,
                    valueVi: (v as any).valueVi,
                    description: (v as any).description,
                  },
                ]
              : [k, v],
          )
          .filter(([_, v]) => v !== null),
      );
      return {
        EC: 1,
        EM: 'Create actor successfully',
        result,
      };
    } catch (error: any) {
      console.error('Error in createActor:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createActor service',
      });
    }
  }

  async getAllActors(query: any) {
    try {
      const { filter, sort } = aqp(query);
      const page = query.page || 1;
      const limit = query.limit || 5;
      const skip = (page - 1) * limit;

      delete filter.page;
      delete filter.limit;
      delete filter.skip;
      delete filter.sort;

      const order = sort || { actorId: 'ASC' };

      const [data, total] = await this.actorRepo.findAndCount({
        relations: ['genderActor', 'nationalityActor'],
        select: {
          genderActor: {
            keyMap: true,
            valueEn: true,
            valueVi: true,
            description: true,
          },
        },
        where: filter,
        order,
        skip,
        take: limit,
      });
      if (total === 0)
        return {
          EC: 1,
          EM: 'No actors found',
          meta: { page, limit, total, totalPages: 0 },
        };
      const actors = data.map((a) => {
        const slug = a.slug;
        const { createdBy, ...newData } = a as any;

        const genderCodeActor = newData.genderCodeActor
          ? {
              keyMap: newData.genderCodeActor.keyMap,
              type: newData.genderCodeActor.type,
              valueEn: newData.genderCodeActor.valueEn,
              valueVi: newData.genderCodeActor.valueVi,
              description: newData.genderCodeActor.description,
            }
          : null;

        const nationalityActor = newData.nationalityActor
          ? {
              keyMap: newData.nationalityActor.keyMap,
              type: newData.nationalityActor.type,
              valueEn: newData.nationalityActor.valueEn,
              valueVi: newData.nationalityActor.valueVi,
              description: newData.nationalityActor.description,
            }
          : null;

        return Object.fromEntries(
          Object.entries({
            ...newData,
            slug,
            genderCodeActor,
            nationalityActor,
          }).filter(([_, v]) => v !== null),
        );
      });
      return {
        EC: 1,
        EM: 'Get all actors successfully',
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        actors,
      };
    } catch (error: any) {
      console.error('Error in getAllActors:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllActors service',
      });
    }
  }

  async getActorById(actorId: number): Promise<any> {
    try {
      const actor = await this.actorRepo.findOne({
        where: { actorId },
        relations: ['genderActor', 'nationalityActor'],
      });
      if (!actor) return { EC: 0, EM: `Actor ${actorId} not found` };
      const { createdAt, updatedAt, createdBy, ...newData } = actor as any;
      Object.entries(actor).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null && 'keyMap' in v) {
          newData[k] = {
            keyMap: v.keyMap,
            type: v.type,
            valueEn: v.valueEn,
            valueVi: v.valueVi,
            description: v.description,
          };
        }
      });
      Object.entries(newData)
        .filter(([_, v]) => v === null || v === undefined)
        .forEach(([k]) => delete newData[k]);

      return { EC: 1, EM: 'Get actor successfully', ...newData };
    } catch (error: any) {
      console.error('Error in getActorById:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getActorById service',
      });
    }
  }

  async getActorBySlug(slug: string): Promise<any> {
    try {
      const actor = await this.actorRepo.findOne({
        where: { slug },
        relations: ['genderActor', 'nationalityActor'],
      });
      if (!actor) return { EC: 0, EM: `Actor ${slug} not found` };
      const { createdAt, updatedAt, createdBy, ...newData } = actor as any;
      Object.entries(actor).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null && 'keyMap' in v) {
          newData[k] = {
            keyMap: v.keyMap,
            type: v.type,
            valueEn: v.valueEn,
            valueVi: v.valueVi,
            description: v.description,
          };
        }
      });
      Object.entries(newData)
        .filter(([_, v]) => v === null || v === undefined)
        .forEach(([k]) => delete newData[k]);

      return { EC: 1, EM: 'Get actor successfully', ...newData };
    } catch (error: any) {
      console.error('Error in getActorBySlug:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getActorBySlug service',
      });
    }
  }

  async updateActor(actorId: number, dto: UpdateActorDto, user: IUser): Promise<any> {
    try {
      const actor = await this.actorRepo.findOne({
        where: { actorId },
        relations: ['genderActor', 'nationalityActor'],
      });
      if (!actor) return { EC: 0, EM: `Actor ${actorId} not found!` };

      if (dto.actorName) {
        actor.actorName = dto.actorName;
        const baseSlug = SlugUtil.slugifyVietnamese(dto.actorName);
        actor.slug = await SlugUtil.generateUniqueSlug(baseSlug, this.actorRepo);
      }

      if (dto.genderCode) {
        const gender = await this.allcodeRepo.findOne({
          where: { keyMap: dto.genderCode, type: 'GENDER' },
        });
        if (!gender) return { EC: 0, EM: `${dto.genderCode} is not valid!` };
        actor.genderActor = gender;
      }

      if (dto.nationalityCode) {
        const nationality = await this.allcodeRepo.findOne({
          where: { keyMap: dto.nationalityCode, type: 'COUNTRY' },
        });
        if (!nationality) return { EC: 0, EM: `Nationality ${dto.nationalityCode} is not valid!` };
        actor.nationalityActor = nationality;
      }

      if (dto.avatarUrl) actor.avatarUrl = dto.avatarUrl;
      const d = dto.birthDate as any;
      actor.birthDate = new Date(
        typeof d === 'string' && d.includes('/') ? d.split('/').reverse().join('-') : d,
      );

      actor.updatedBy = user.userId;
      const data = await this.actorRepo.save(actor);
      // search
      await this.searchService.updateDocument(actor.actorId.toString(), actor, 'actors');
      // search

      const result = Object.fromEntries(
        Object.entries(data)
          .map(([k, v]) =>
            typeof v === 'object' && v?.keyMap
              ? [
                  k,
                  {
                    keyMap: v.keyMap,
                    type: v.type,
                    valueEn: v.valueEn,
                    valueVi: v.valueVi,
                    description: v.description,
                  },
                ]
              : [k, v],
          )
          .filter(([_, v]) => v !== null),
      );
      return {
        EC: 1,
        EM: 'Update director successfully',
        ...result,
      };
    } catch (error: any) {
      console.error('Error in updateActor:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateActor service',
      });
    }
  }

  async deleteActorById(actorId: number, user: IUser): Promise<any> {
    try {
      const actor = await this.actorRepo.findOne({ where: { actorId } });
      if (!actor) return { EC: 0, EM: `Actor ${actorId} not found!` };
      const actorIdStr = actor.actorId.toString();
      await this.actorRepo.remove(actor);
      // search
      await this.searchService.removeFromIndex(actorIdStr, 'actors');
      // search
      return { EC: 1, EM: 'Delete actor successfully' };
    } catch (error: any) {
      console.error('Error in deleteActorById:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteActorById service',
      });
    }
  }
}
