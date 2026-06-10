import { forwardRef, Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { FilmSearchService } from './filmSearch.service';
import { ConfigService } from '@nestjs/config';
import { FilmsModule } from '../films/films.module';
import { FilmsService } from '../films/films.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Film } from '../films/entities/film.entity';
import { ActorSearchService } from './actorSearch.service';
import { DirectorSearchService } from './directorSearch.service';
import { ProducerSearchService } from './producerSearch.service';
import { Actor } from '../actor/entities/actor.entity';
import { Director } from '../directors/entities/director.entity';
import { Producer } from '../producers/entities/producer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Film, Actor, Director, Producer]),
    forwardRef(() => FilmsModule),
    ElasticsearchModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        node: 'http://localhost:9200',
        // auth: {
        //   username: configService.get<string>('ELASTICSEARCH_USERNAME')!,
        //   password: configService.get<string>('ELASTICSEARCH_PASSWORD')!,
        // },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [FilmSearchService, ActorSearchService, DirectorSearchService, ProducerSearchService],
  exports: [FilmSearchService, ActorSearchService, DirectorSearchService, ProducerSearchService],
})
export class SearchModule {}
