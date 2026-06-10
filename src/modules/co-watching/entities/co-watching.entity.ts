import { Film } from 'src/modules/films/entities/film.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'rooms_co_watching' })
export class RoomCoWatching {
  @PrimaryGeneratedColumn('uuid')
  roomId: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ nullable: false })
  hostId: number;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hostId', referencedColumnName: 'userId' })
  host: User;

  @Column({ type: 'uuid', nullable: false })
  filmId: string;

  @ManyToOne(() => Film, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId', referencedColumnName: 'filmId' })
  film: Film;

  @Column({ nullable: false })
  partNumber: number;

  @Column({ nullable: false })
  episodeNumber: number;

  @Column({ nullable: false })
  thumbUrl: string;

  @Column({ type: 'boolean', default: true })
  isLive: boolean;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'int', default: 0 })
  duration?: number;
}
