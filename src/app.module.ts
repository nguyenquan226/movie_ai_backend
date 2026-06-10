import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { DatabasesModule } from 'src/databases/databases.module';
import { AllCodesModule } from 'src/modules/all-codes/all-codes.module';
import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { Role } from 'src/modules/roles/entities/role.entity';
import { RolesModule } from 'src/modules/roles/roles.module';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { Director } from 'src/modules/directors/entities/director.entity';
import { DirectorModule } from 'src/modules/directors/director.module';
import { Producer } from './modules/producers/entities/producer.entity';
import { FilmsModule } from './modules/films/films.module';
import { Film } from 'src/modules/films/entities/film.entity';
import { FileModule } from './modules/file/file.module';
import { RolePermission } from './modules/role_permission/entities/role_permission.entity';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { MarkdownsModule } from './modules/markdowns/markdowns.module';
import { FilmGenre } from './modules/films/entities/film_genre.entity';
import { PartsModule } from './modules/parts/parts.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { Part } from './modules/parts/entities/part.entity';
import { Episode } from './modules/episodes/entities/episode.entity';
import { FilmDirectorModule } from './modules/film_director/film_director.module';
import { FilmDirector } from './modules/film_director/entities/film_director.entity';
import { ActorModule } from './modules/actor/actor.module';
import { Actor } from './modules/actor/entities/actor.entity';
import { FilmActorModule } from './modules/film_actor/film_actor.module';
import { FilmActor } from './modules/film_actor/entities/film_actor.entity';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { Subscription } from './modules/subscriptions/entities/subscription.entity';
import { Markdown } from './modules/markdowns/entities/markdown.entity';
import { SubscriptionPlan } from './modules/subscription-plans/entities/subscription-plan.entity';
import { PaymentsModule } from './modules/payments/payments.module';
import { Payment } from './modules/payments/entities/payment.entity';
import { EmailModule } from './modules/email/email.module';

import { CommentModule } from './modules/comment/comment.module';
import { Comment } from './modules/comment/entities/comment.entity';
import { CommentReactionModule } from './modules/comment-reaction/comment-reaction.module';
import { CommentReaction } from './modules/comment-reaction/entities/comment-reaction.entity';
import { RatingModule } from './modules/rating/rating.module';
import { Rating } from './modules/rating/entities/rating.entity';
import { ReportModule } from './modules/report/report.module';
import { Report } from './modules/report/entities/report.entity';
import { FilmImage } from './modules/films/entities/film_image.entity';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { SearchModule } from './modules/search/search.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { Favorite } from './modules/favorites/entities/favorite.entity';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { Playlist } from './modules/playlists/entities/playlist.entity';
import { PlaylistFilmModule } from './modules/playlist-film/playlist-film.module';
import { PlaylistFilm } from './modules/playlist-film/entities/playlist-film.entity';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { Notification } from './modules/notifications/entities/notification.entity';

import { ProducerModule } from './modules/producers/producer.module';
import { FilmProducerModule } from './modules/film_producer/film_producer.module';
import { FilmProducer } from './modules/film_producer/entities/film_producer.entity';
import { WatchGateway } from './modules/films/socket/watch-gateway';
import { RedisModule } from './modules/redis/redis.module';
import { CoWatchingModule } from './modules/co-watching/co-watching.module';
import { RoomCoWatching } from './modules/co-watching/entities/co-watching.entity';
import { BullModule } from '@nestjs/bull';
import { BullConfigService } from './config/bull.config';
import { VideoModule } from './modules/video/video.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StartupBannerService } from 'src/cores/startup-banner.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          User,
          AllCode,
          Permission,
          Role,
          Director,
          Producer,
          Film,
          RolePermission,
          FilmGenre,
          FilmImage,
          Part,
          Episode,
          FilmDirector,
          FilmProducer,
          Actor,
          FilmActor,
          Subscription,
          Markdown,
          SubscriptionPlan,
          Payment,
          Comment,
          CommentReaction,
          Rating,
          Report,
          Favorite,
          Playlist,
          PlaylistFilm,
          Notification,
          RoomCoWatching,
        ],
        synchronize: true,
        // logging: true,
      }),
    }),
    UsersModule,
    AllCodesModule,
    AuthModule,
    DatabasesModule,
    PermissionsModule,
    RolesModule,
    RolePermissionModule,
    DirectorModule,
    FilmsModule,
    SubscriptionPlansModule,
    MarkdownsModule,
    PartsModule,
    EpisodesModule,
    FilmDirectorModule,
    ActorModule,
    FilmActorModule,
    FilmDirector,
    SubscriptionsModule,
    PaymentsModule,
    EmailModule,
    CommentModule,
    CommentReactionModule,
    RatingModule,
    ReportModule,
    ChatbotModule,
    SearchModule,
    FavoritesModule,
    PlaylistsModule,
    PlaylistFilmModule,
    NotificationsModule,
    ProducerModule,
    FilmProducerModule,
    FilmProducer,

    CoWatchingModule,
    RedisModule,

    BullModule.forRootAsync({
      imports: [RedisModule],
      useClass: BullConfigService,
    }),
    FileModule,
    VideoModule,
  ],

  controllers: [AppController],
  providers: [AppService, WatchGateway, StartupBannerService],
})
export class AppModule {}
