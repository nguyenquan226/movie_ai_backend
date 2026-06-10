import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Film } from 'src/modules/films/entities/film.entity';
import { Part } from 'src/modules/parts/entities/part.entity';
import { Episode } from 'src/modules/episodes/entities/episode.entity';
import { CommentReaction } from 'src/modules/comment-reaction/entities/comment-reaction.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  commentId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isHidden: boolean;
  
  @Column({ default: 0 })
  totalLike: number;

  @Column({ default: 0 })
  totalDislike: number;

  @Column({ default: 0 })
  totalChildrenComment: number;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Film, (film) => film.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filmId' })
  film: Film;

  @ManyToOne(() => Part, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partId' })
  part?: Part;

  @ManyToOne(() => Episode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'episodeId' })
  episode?: Episode;

  @ManyToOne(() => Comment, (comment) => comment.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];

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
  deletedBy: number;

  @OneToMany(() => CommentReaction, (reaction) => reaction.comment)
  reactions: CommentReaction[];
}
