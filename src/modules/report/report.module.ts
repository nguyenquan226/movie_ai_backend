import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Report } from './entities/report.entity';
import { ReportGateway } from './socket/report-gateway';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Rating } from '../rating/entities/rating.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentModule } from '../comment/comment.module';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, Comment, Rating]),
    NotificationsModule,
    CommentModule,
    RatingModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportGateway],
  exports: [ReportService, ReportGateway],
})
export class ReportModule {}
