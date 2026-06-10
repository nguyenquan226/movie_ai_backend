import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { Film } from 'src/modules/films/entities/film.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'film_genre' })
@Index(['filmId', 'genreCode'], { unique: true })
export class FilmGenre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  filmId: string;

  @Column({ nullable: false })
  @Index()
  genreCode: string;

  @ManyToOne(() => Film, (film) => film.filmGenres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId' })
  film: Film;

  @ManyToOne(() => AllCode, (allcode) => allcode.filmGenres)
  @JoinColumn({ name: 'genreCode', referencedColumnName: 'keyMap' })
  genre: AllCode;
}
