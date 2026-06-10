import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailModule } from '../email/email.module';
import { PaymentReportService } from './payment-report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, SubscriptionPlan, Subscription, User]), EmailModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    SubscriptionPlansService,
    SubscriptionsService,
    UsersService,
    PaymentReportService,
  ],
  exports: [PaymentsService, PaymentReportService],
})
export class PaymentsModule {}
