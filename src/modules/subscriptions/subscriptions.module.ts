import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, SubscriptionPlan])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionPlansService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
