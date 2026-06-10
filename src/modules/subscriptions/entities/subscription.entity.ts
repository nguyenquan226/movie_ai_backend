import { Payment } from 'src/modules/payments/entities/payment.entity';
import { SubscriptionPlan } from 'src/modules/subscription-plans/entities/subscription-plan.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionStatus } from '../types/subscriptionStatus';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  subscriptionId: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @CreateDateColumn({ nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  createdBy?: number;

  @Column({ nullable: true })
  updatedBy?: number;

  @Column({ nullable: true })
  deletedBy?: number;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan)
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'planId' })
  plan: SubscriptionPlan;

  @ManyToOne(() => User, (plan) => plan)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;

  @OneToOne(() => Payment, (payment) => payment)
  @JoinColumn({ name: 'payment_id', referencedColumnName: 'paymentId' })
  payment: Payment;
}
