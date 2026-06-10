import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Rating } from './entities/rating.entity';
import { Film } from '../films/entities/film.entity';
import { RatingGateway } from './socket/rating-gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Film, User]), NotificationsModule],
  controllers: [RatingController],
  providers: [RatingService, RatingGateway],
  exports: [RatingService, RatingGateway],
})
export class RatingModule {}
