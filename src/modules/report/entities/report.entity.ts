import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportType {
  COMMENT = 'COMMENT',
  RATING = 'RATING',
  FILM = 'FILM',
  USER = 'USER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  DISMISSED = 'DISMISSED',
  ACTIONED = 'ACTIONED',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  reportId: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({ type: 'varchar', length: 36 })
  targetId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewedBy?: User;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
