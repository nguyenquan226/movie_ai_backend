import { Module } from "@nestjs/common"
import { FilmProducerService } from "./film_producer.service"
import { FilmProducerController } from "./film_producer.controller"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Producer } from "../producers/entities/producer.entity"
import { FilmProducer } from "./entities/film_producer.entity"
import { Film } from "../films/entities/film.entity"

@Module({
  imports: [TypeOrmModule.forFeature([FilmProducer, Film, Producer])],
  controllers: [FilmProducerController],
  providers: [FilmProducerService],
  exports: [TypeOrmModule, FilmProducerService],
})
export class FilmProducerModule {}
