import { PlaylistFilm } from 'src/modules/playlist-film/entities/playlist-film.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'playlists' })
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  playlistId: string;

  @Column({ name: 'userId' })
  userId: number;

  @ManyToOne(() => User, (user) => user.playlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user: User;

  @Column()
  playlistName: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PlaylistFilm, (pf) => pf.playlist, { cascade: true })
  playlistFilms: PlaylistFilm[];
}
