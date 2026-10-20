import { DatabasesModule } from 'src/databases/databases.module';
import { RedisModule } from './redis/redis.module';
import { FileModule } from './file/file.module';
import { VideoModule } from './video/video.module';
import { EmailModule } from './email/email.module';

import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { RolePermissionModule } from './role_permission/role_permission.module';

import { FilmsModule } from './films/films.module';
import { PartsModule } from './parts/parts.module';
import { EpisodesModule } from './episodes/episodes.module';
import { AllCodesModule } from 'src/modules/all-codes/all-codes.module';
import { MarkdownsModule } from './markdowns/markdowns.module';

import { DirectorModule } from 'src/modules/directors/director.module';
import { ActorModule } from './actor/actor.module';
import { ProducerModule } from './producers/producer.module';

import { FilmDirectorModule } from './film_director/film_director.module';
import { FilmActorModule } from './film_actor/film_actor.module';
import { FilmProducerModule } from './film_producer/film_producer.module';

import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';

import { CommentModule } from './comment/comment.module';
import { CommentReactionModule } from './comment-reaction/comment-reaction.module';
import { RatingModule } from './rating/rating.module';
import { ReportModule } from './report/report.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { PlaylistFilmModule } from './playlist-film/playlist-film.module';
import { NotificationsModule } from './notifications/notifications.module';

import { ChatbotModule } from './chatbot/chatbot.module';
import { SearchModule } from './search/search.module';
import { CoWatchingModule } from './co-watching/co-watching.module';
import { HealthModule } from './health/health.module';

// ─── Infrastructure ──────────────────────────────────────
export const INFRASTRUCTURE_MODULES = [
  DatabasesModule,
  RedisModule,
  FileModule,
  VideoModule,
  EmailModule,
];

// ─── Auth & User Management ─────────────────────────────
export const AUTH_MODULES = [
  AuthModule,
  UsersModule,
  RolesModule,
  PermissionsModule,
  RolePermissionModule,
];

// ─── Content ─────────────────────────────────────────────
export const CONTENT_MODULES = [
  FilmsModule,
  PartsModule,
  EpisodesModule,
  AllCodesModule,
  MarkdownsModule,
];

// ─── People ──────────────────────────────────────────────
export const PEOPLE_MODULES = [
  DirectorModule,
  ActorModule,
  ProducerModule,
];

// ─── Relationships (Pivots) ─────────────────────────────
export const RELATIONSHIP_MODULES = [
  FilmDirectorModule,
  FilmActorModule,
  FilmProducerModule,
];

// ─── Subscription & Payments ────────────────────────────
export const SUBSCRIPTION_MODULES = [
  SubscriptionPlansModule,
  SubscriptionsModule,
  PaymentsModule,
];

// ─── Social & Interaction ───────────────────────────────
export const SOCIAL_MODULES = [
  CommentModule,
  CommentReactionModule,
  RatingModule,
  ReportModule,
  FavoritesModule,
  PlaylistsModule,
  PlaylistFilmModule,
  NotificationsModule,
];

// ─── Features ───────────────────────────────────────────
export const FEATURE_MODULES = [
  ChatbotModule,
  SearchModule,
  CoWatchingModule,
  HealthModule,
];

// ─── All Application Modules ────────────────────────────
export const APP_MODULES = [
  ...INFRASTRUCTURE_MODULES,
  ...AUTH_MODULES,
  ...CONTENT_MODULES,
  ...PEOPLE_MODULES,
  ...RELATIONSHIP_MODULES,
  ...SUBSCRIPTION_MODULES,
  ...SOCIAL_MODULES,
  ...FEATURE_MODULES,
];
