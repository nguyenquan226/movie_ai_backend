import { Episode } from 'src/modules/episodes/entities/episode.entity';
import { Film } from 'src/modules/films/entities/film.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'parts' })
export class Part {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: false, type: 'int' })
  partNumber: number;

  @Column({ type: 'text', nullable: false })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: false, type: 'uuid' })
  filmId: string;

  @ManyToOne(() => Film, (film) => film.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId' })
  film: Film;

  @OneToMany(() => Episode, (episode) => episode.part, { cascade: true })
  episodes: Episode[];
}
