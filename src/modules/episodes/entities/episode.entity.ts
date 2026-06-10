import { Part } from 'src/modules/parts/entities/part.entity';
import { Comment } from 'src/modules/comment/entities/comment.entity';
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

@Entity({ name: 'episodes' })
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  episodeNumber: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  slug: string;

  @Column({ type: 'int', nullable: false })
  duration: number;

  @Column({ nullable: false })
  videoUrl: string;

  @Column({ nullable: false })
  thumbUrl: string;

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
  partId: string;

  @ManyToOne(() => Part, (part) => part.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partId' })
  part: Part;

  @OneToMany(() => Comment, (comment) => comment.episode)
  comments: Comment[];
}
