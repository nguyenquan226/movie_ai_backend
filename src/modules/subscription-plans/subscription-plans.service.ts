import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import type { IUser } from '../users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {}
  async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto, user: IUser) {
    try {
      const { planName } = createSubscriptionPlanDto;
      const isExist = await this.subscriptionPlanRepository.exists({
        where: { planName: planName },
      });

      if (isExist) {
        return {
          EC: 0,
          EM: `subscription plan  ${planName} is already exist`,
        };
      } else {
        const newPlan = this.subscriptionPlanRepository.create({
          ...createSubscriptionPlanDto,
          createdBy: user.userId,
        });

        await this.subscriptionPlanRepository.save(newPlan);

        return {
          EC: 1,
          EM: 'Create new subscription plan success',
          planId: newPlan?.planId,
          createdAt: newPlan?.createdAt,
        };
      }
    } catch (error: any) {
      console.error('Error in create subscription plan package:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: `Error from create subscription plan service`,
      });
    }
  }

  async findAll() {
    try {
      const result = await this.subscriptionPlanRepository.find({
        where: { isActive: true, deletedAt: IsNull() },
        relations: ['durationInfo'],
        select: {
          planId: true,
          planName: true,
          planDuration: true,
          price: true,
          isActive: true,
          durationInfo: {
            keyMap: true,
            type: true,
            valueEn: true,
            valueVi: true,
          },
        },
      });
      if (result) {
        return {
          EC: 1,
          EM: 'Get all plans success',
          plans: result,
        };
      }
    } catch (error: any) {
      console.error('Error in findAll plans:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findAll plans service',
      });
    }
  }

  async findOne(id: number) {
    try {
      const plan = await this.subscriptionPlanRepository.findOne({
        where: { planId: id, deletedAt: IsNull() },
        relations: ['durationInfo'],
        select: {
          planId: true,
          planName: true,
          planDuration: true,
          price: true,
          isActive: true,
          durationInfo: {
            keyMap: true,
            type: true,
            valueEn: true,
            valueVi: true,
          },
        },
      });

      if (!plan) {
        return {
          EC: 0,
          EM: 'Subscription plan not found',
        };
      }

      return {
        EC: 1,
        EM: 'Find subscription plan success',
        ...plan,
      };
    } catch (error: any) {
      console.error('Error in findOne subscription plan:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne subscription plan service',
      });
    }
  }

  async update(id: number, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto, user: IUser) {
    try {
      const updateResult = await this.subscriptionPlanRepository.update(
        {
          planId: id,
        },
        {
          ...updateSubscriptionPlanDto,
          updatedAt: new Date(),
          updatedBy: user.userId,
        },
      );

      if (updateResult.affected === 0) {
        return {
          EC: 0,
          EM: 'Plan not found',
        };
      }

      return {
        EC: 1,
        EM: 'Update Plan success',
        ...updateResult,
      };
    } catch (error: any) {
      console.error('Error in update Plan:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update Plan service',
      });
    }
  }

  async remove(id: number, user: IUser) {
    try {
      const result = await this.subscriptionPlanRepository.update(
        {
          planId: id,
        },
        {
          deletedBy: user.userId,
        },
      );

      if (result.affected === 0) {
        return {
          EC: 0,
          EM: 'PLan not found',
        };
      } else {
        await this.subscriptionPlanRepository.softDelete(id);

        return {
          EC: 1,
          EM: `Plan is deleted`,
          ...result,
        };
      }
    } catch (error: any) {
      console.error('Error in delete Plan:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from delete Plan service',
      });
    }
  }
}
