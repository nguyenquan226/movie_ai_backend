import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notificationId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'replierId' })
  replier: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
