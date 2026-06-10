import { Director } from 'src/modules/directors/entities/director.entity';
import { Film } from 'src/modules/films/entities/film.entity';
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

@Entity({ name: 'film_directors' })
export class FilmDirector {
  @PrimaryGeneratedColumn({ name: 'film_director_id' })
  id: number;

  @Column({ name: 'is_main' })
  isMain: boolean;

  @ManyToOne(() => Film, (film) => film.filmDirectors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'film_id', referencedColumnName: 'filmId' })
  film: Film;

  @ManyToOne(() => Director, (director) => director.filmDirectors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'director_id', referencedColumnName: 'directorId' })
  director: Director;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @Column({ nullable: true })
  createdBy: number;
  @Column({ nullable: true })
  updatedBy: number;
  @Column({ nullable: true })
  deletedBy: number;
}
