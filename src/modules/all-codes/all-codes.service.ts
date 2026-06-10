import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAllCodeDto } from './dto/create-all-code.dto';
import { UpdateAllCodeDto } from './dto/update-all-code.dto';
import { InjectRepository } from '@nestjs/typeorm';

import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';

import { Repository } from 'typeorm';

@Injectable()
export class AllCodesService {
  constructor(
    @InjectRepository(AllCode)
    private allCodeRepository: Repository<AllCode>,
  ) {}
  async create(createAllCodeDto: CreateAllCodeDto) {
    try {
      const isUserExist = await this.allCodeRepository.findOne({
        where: { keyMap: createAllCodeDto.keyMap, type: createAllCodeDto.type },
      });

      if (isUserExist) {
        return {
          EC: 0,
          EM: `KeyMap: ${createAllCodeDto.keyMap} in Type: ${createAllCodeDto.type} already exists in the system.`,
        };
      } else {
        const newCode = this.allCodeRepository.create({
          ...createAllCodeDto,
        });
        await this.allCodeRepository.save(newCode);
        return {
          EC: 1,
          EM: 'Create code success',
          createdAt: newCode?.createdAt,
        };
      }
    } catch (error) {
      console.error('Error in create code:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from create code service',
      });
    }
  }

  findAll() {
    return { EC: 0, EM: `This action returns all allCodes` };
  }

  findOne(id: number) {
    return { EC: 0, EM: `This action returns a #${id} allCode` };
  }

  update(id: number, updateAllCodeDto: UpdateAllCodeDto) {
    return { EC: 0, EM: `This action updates a #${id} allCode` };
  }

  remove(id: number) {
    return { EC: 0, EM: `This action removes a #${id} allCode` };
  }

  async getAllCodeDataByType(type: string) {
    try {
      const result = await this.allCodeRepository.find({
        where: { type: type },
        select: {
          id: true,
          keyMap: true,
          valueEn: true,
          valueVi: true,
          description: true,
        },
      });

      if (result) {
        return {
          EC: 1,
          EM: 'Get gender success',
          [type]: result,
        };
      } else {
        return {
          EC: 0,
          EM: 'Get gender failed',
        };
      }
    } catch (error) {
      console.error('Error in get by type allcode:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from get by type allcode service',
      });
    }
  }
}
