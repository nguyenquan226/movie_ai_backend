import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { User } from 'src/decorators/customize';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { SubscriptionStatus } from './types/subscriptionStatus';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private SubscriptionRepository: Repository<Subscription>,
  ) {}
  create(createSubscriptionDto: CreateSubscriptionDto) {
    return 'This action adds a new subscription';
  }

  findAll() {
    return `This action returns all subscriptions`;
  }

  async findOne(id: number) {
    try {
      const subscription = await this.SubscriptionRepository.findOne({
        where: { userId: id, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
        select: {
          subscriptionId: true,
          userId: true,
          startDate: true,
          endDate: true,
          status: true,
          autoRenew: true,
          plan: {
            planId: true,
            planName: true,
            planDuration: true,
            durationTypeCode: true,
            price: true,
            isActive: true,
          },
        },
      });

      if (subscription) {
        return {
          EC: 1,
          EM: 'Fetch subscription sucess',
          ...subscription,
        };
      } else {
        return {
          EC: 0,
          EM: 'No sub',
        };
      }
    } catch (error) {
      console.error('Error in findOne Sub:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update findOne Sub',
      });
    }
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
