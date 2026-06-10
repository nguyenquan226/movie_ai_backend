import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../types/enum';
import { User } from 'src/modules/users/entities/user.entity';
import { Subscription } from 'src/modules/subscriptions/entities/subscription.entity';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.VNPAY,
  })
  paymentMethod: PaymentMethod;

  // VNPay transaction details
  @Column({ nullable: true })
  vnpayTxnRef: string; // Mã giao dịch của VNPay

  @Column({ nullable: true })
  vnpayResponseCode: string; // Mã phản hồi từ VNPay

  @Column({ nullable: true })
  vnpayBankCode: string; // Mã ngân hàng

  @Column({ nullable: true })
  vnpayTransactionNo: string; // Mã giao dịch

  @Column({ type: 'text', nullable: true })
  vnpayOrderInfo: string; // Thông tin đơn hàng

  @Column({ type: 'timestamp', nullable: true })
  vnpayPayDate: Date; // Thời gian thanh toán

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;

  @OneToOne(() => Subscription, (sub) => sub.payment)
  subscription: Subscription;
}
