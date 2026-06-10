import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentReactionService } from './comment-reaction.service';
import { CommentReactionController } from './comment-reaction.controller';
import { CommentReaction } from './entities/comment-reaction.entity';
import { Comment } from '../comment/entities/comment.entity';
import { CommentModule } from '../comment/comment.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentReaction, Comment]),
    CommentModule,
    NotificationsModule,
  ],
  controllers: [CommentReactionController],
  providers: [CommentReactionService],
  exports: [CommentReactionService],
})
export class CommentReactionModule {}
