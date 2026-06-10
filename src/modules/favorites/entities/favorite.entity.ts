import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Film } from 'src/modules/films/entities/film.entity';

@Entity({ name: 'favorites' })
@Unique(['user', 'film'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  favId: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'film_id' })
  filmId: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;

  @ManyToOne(() => Film, (film) => film.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'film_id', referencedColumnName: 'filmId' })
  film: Film;

  @CreateDateColumn()
  createdAt: Date;
}
