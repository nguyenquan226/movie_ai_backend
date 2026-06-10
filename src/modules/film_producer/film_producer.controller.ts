import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  Body,
  ParseIntPipe,
  BadRequestException,
} from "@nestjs/common"
import { FilmProducerService } from "./film_producer.service"
import { CreateFilmProducerDto } from "./dto/create-film_producer.dto"
import { UpdateFilmProducerDto } from "./dto/update-film_producer.dto"
import { Public, ResponseMessage, SkipCheckPermission, User } from "src/decorators/customize"
import { PaginationfpDto } from "./dto/pagination-fp.dto"
import type { IUser } from "../users/interface/user.interface"
import { Permission } from "src/decorators/permission.decorator"

@Controller("film-producer")
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
export class FilmProducerController {
  constructor(private readonly filmProducerService: FilmProducerService) { }

  @Post("create-film-producer")
  @Permission('Create a film-producer relation', 'FILM-PRODUCER')
  @ResponseMessage("Create relation between film and producer")
  @SkipCheckPermission()
  createFilmProducer(@Body() dto: CreateFilmProducerDto, @User() user: IUser) {
    return this.filmProducerService.createFilmProducer(dto, user)
  }

  @Public()
  @Get('all-film-producers')
  @Permission('Get all film-producer relations', 'FILM-PRODUCER')
  @ResponseMessage('Get all film-producer relations')
  GetAllFilmProducers(@Query() query: PaginationfpDto) {
    return this.filmProducerService.getAllFilmProducers(query);
  }

  @Public()
  @Get('get-film-producer-by-id/:id')
  @Permission('Get a film-producer relation by ID', 'FILM-PRODUCER')
  @ResponseMessage('Get film-producer relation by id')
  getFilmProducerById(@Param('id', ParseIntPipe) id: number) {
    return this.filmProducerService.getFilmProducerById(id);
  }

  @Public()
  @Get("by-film/:filmId")
  @Permission('Get producers by film ID', 'FILM-PRODUCER')
  @ResponseMessage("Get producers by film")
  getProducersByFilm(@Param('filmId') filmId: string, @Query() query: PaginationfpDto) {
    return this.filmProducerService.getProducersByFilm(filmId, query)
  }

  @Public()
  @Get("by-producer/:producerId")
  @Permission('Get films by producer ID', 'FILM-PRODUCER')
  @ResponseMessage("Get films by producer")
  getFilmsByProducer(@Param('producerId') producerId: number, @Query() query: PaginationfpDto) {
    return this.filmProducerService.getFilmsByProducer(producerId, query)
  }

  @Patch("edit-film-producer/:id")
  @Permission('Update a film-producer relation by ID', 'FILM-PRODUCER')
  @ResponseMessage("Update film-producer relation by id")
  updateFilmProducer(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFilmProducerDto, @User() user: IUser) {
    return this.filmProducerService.updateFilmProducer(id, dto, user)
  }

  @Delete("delete-film-producer/:id")
  @Permission('Delete a film-producer relation by ID', 'FILM-PRODUCER')
  @ResponseMessage("Delete film-producer relation by id")
  deleteFilmProducer(@Param('id', ParseIntPipe) id: number, @User() user: IUser) {
    if (!user || !user.userId) {
      throw new BadRequestException({ EC: 0, EM: 'User is required to delete relation' })
    }
    return this.filmProducerService.deleteFilmProducer(id, user)
  }
}
