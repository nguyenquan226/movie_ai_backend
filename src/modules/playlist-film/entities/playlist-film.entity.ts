import { Film } from 'src/modules/films/entities/film.entity';
import { Playlist } from 'src/modules/playlists/entities/playlist.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'playlist-film' })
@Unique(['playlistId', 'filmId'])
export class PlaylistFilm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'playlistId' })
  playlistId: string;

  @ManyToOne(() => Playlist, (p) => p.playlistFilms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlistId', referencedColumnName: 'playlistId' })
  playlist: Playlist;

  @Column({ name: 'filmId' })
  filmId: string;

  @ManyToOne(() => Film, (f) => f.playlistFilms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId', referencedColumnName: 'filmId' })
  film: Film;

  @Column({ type: 'int', nullable: true })
  position: number;

  @CreateDateColumn()
  addedAt: Date;
}
