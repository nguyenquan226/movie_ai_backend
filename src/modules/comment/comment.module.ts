import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Film } from 'src/modules/films/entities/film.entity';
import { Part } from 'src/modules/parts/entities/part.entity';
import { Episode } from 'src/modules/episodes/entities/episode.entity';
import { CommentGateway } from './socket/comment-gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [CommentController],
  imports: [TypeOrmModule.forFeature([Comment, User, Film, Part, Episode]), NotificationsModule],
  providers: [CommentService, CommentGateway],
  exports: [CommentService, CommentGateway],
})
export class CommentModule {}
