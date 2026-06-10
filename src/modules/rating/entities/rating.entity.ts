import { User } from 'src/modules/users/entities/user.entity';
import { Film } from 'src/modules/films/entities/film.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rating')
@Unique(['user', 'film'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  ratingId: string;
  @ManyToOne(() => User, (user) => user.ratings)
  @JoinColumn({ name: 'userId' })
  user: User;
  @ManyToOne(() => Film, (film) => film.ratings)
  @JoinColumn({ name: 'filmId' })
  film: Film;
  @Column({ type: 'float', default: 0 })
  ratingValue: number;
  @Column({ type: 'text', nullable: true })
  content: string;
  @Column({ default: false })
  isHidden: boolean;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @Column({ nullable: true })
  createdBy: number;
  @Column({ nullable: true })
  updatedBy: number;
  @Column({ nullable: true })
  deletedBy?: number;
}
