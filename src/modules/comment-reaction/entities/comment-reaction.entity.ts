import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';
import { Comment } from 'src/modules/comment/entities/comment.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('comment-reaction')
@Unique(['user', 'comment'])
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  commentReactionId: string;

  @ManyToOne(() => User, (user) => user.commentReactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Comment, (comment) => comment.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column({ type: 'enum', enum: ['LIKE', 'DISLIKE'] })
  type: 'LIKE' | 'DISLIKE';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
