import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Film } from './film.entity';

@Entity({ name: 'film_images' })
export class FilmImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  filmId: string;

  @Column({ nullable: false })
  url: string;

  @Column({ type: 'enum', enum: ['poster', 'horizontal', 'backdrop'] })
  type: 'poster' | 'horizontal' | 'backdrop';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => Film, (film) => film.filmImages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId' })
  film: Film;
}
