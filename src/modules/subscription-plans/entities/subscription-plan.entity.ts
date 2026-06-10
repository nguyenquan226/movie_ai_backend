import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { Subscription } from 'src/modules/subscriptions/entities/subscription.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'subscriptionPlans' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  planId: number;

  @Column()
  planName: string;

  @Column()
  planDuration: number;

  @Column({ name: 'durationType_code' })
  durationTypeCode: string;

  @Column()
  price: string;

  @Column({ default: true })
  isActive: boolean;

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

  @ManyToOne(() => AllCode, (allcode) => allcode.planDuration)
  @JoinColumn({ name: 'durationType_code', referencedColumnName: 'keyMap' })
  durationInfo: AllCode;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Subscription[];
}
