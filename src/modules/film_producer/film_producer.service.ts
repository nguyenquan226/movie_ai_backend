import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Repository, Not } from "typeorm"
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFilmProducerDto } from "./dto/create-film_producer.dto"
import { UpdateFilmProducerDto } from "./dto/update-film_producer.dto"
import { FilmProducer } from "./entities/film_producer.entity"
import { Film } from "../films/entities/film.entity"
import { Producer } from "../producers/entities/producer.entity"
import { PaginationfpDto } from "./dto/pagination-fp.dto"
import { IUser } from "../users/interface/user.interface"
import aqp from "api-query-params"
import { plainToInstance } from 'class-transformer';
import { ListFilm } from '../films/dto/list-film.dto';
import { FilmImage } from '../films/entities/film_image.entity';

@Injectable()
export class FilmProducerService {
  constructor(
    @InjectRepository(FilmProducer)
    private readonly filmProducerRepo: Repository<FilmProducer>,
    @InjectRepository(Film)
    private readonly filmRepo: Repository<Film>,
    @InjectRepository(Producer)
    private readonly producerRepo: Repository<Producer>,
  ) { }

  private formatFilmProducer(entity: any) {
    if (!entity) return null

    const clean = (obj: any) =>
      Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== undefined && v !== ""))

    const film = entity.film
      ? clean({
        filmId: entity.film.filmId,
        originalTitle: entity.film.originalTitle,
        title: entity.film.title,
        description: entity.film.description,
        releaseDate: entity.film.releaseDate,
        year: entity.film.year,
        thumbUrl: entity.film.thumbUrl,
        // posterUrl: entity.film.posterUrl,
        filmImages: entity.film.filmImages?.map((img: FilmImage) => ({
          filmImageId: img.id,
          imageUrl: img.url,
        })),
        slug: entity.film.slug,
        age: entity.film.ageCode,
        type: entity.film.typeCode,
        country: entity.film.countryCode,
        language: entity.film.langCode,
        publicStatus: entity.film.publicStatusCode,
      })
      : null;

    const producer = entity.producer
      ? clean({
        producerId: entity.producer.producerId,
        producerName: entity.producer.producerName,
      })
      : null

    const { id, isMain, createdAt, updatedAt, createdBy, updatedBy } = entity

    return clean({
      id,
      isMain,
      film,
      producer,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
    })
  }

  async createFilmProducer(dto: CreateFilmProducerDto, user: IUser) {
    try {
      const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } })
      const producer = await this.producerRepo.findOne({
        where: { producerId: dto.producerId },
      })

      if (!film || !producer) {
        return { EC: 0, EM: "Film or Producer not found!" }
      }

      const exists = await this.filmProducerRepo.findOne({
        where: { film: { filmId: dto.filmId }, producer: { producerId: dto.producerId } },
      })
      if (exists) {
        return { EC: 0, EM: "This producer is already associated with this film!" }
      }

      if (dto.isMain) {
        const mainExists = await this.filmProducerRepo.findOne({
          where: { film: { filmId: dto.filmId }, isMain: true },
        })
        if (mainExists) {
          return { EC: 0, EM: "Main producer already exists for this film!" }
        }
      }

      const newFilmProducer = this.filmProducerRepo.create({
        film,
        producer,
        isMain: dto.isMain || false,
        createdBy: user.userId,
      })

      const savedFilmProducer = await this.filmProducerRepo.save(newFilmProducer)
      const result = this.formatFilmProducer(savedFilmProducer)

      return { EC: 1, EM: "Create film producer successfully", result }
    } catch (error: any) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from createFilmProducer service",
      })
    }
  }

  async getAllFilmProducers(query: PaginationfpDto) {
    try {
      const page = Number(query.page) || 1
      const limit = Number(query.limit) || 10
      const sort = query.sort?.toUpperCase() === "DESC" ? "DESC" : "ASC"
      const skip = (page - 1) * limit

      const [data, total] = await this.filmProducerRepo.findAndCount({
        relations: ["film", "producer"],
        order: { id: sort },
        skip,
        take: limit,
      })

      const result = data.map((fp) => ({
        id: fp.id,
        isMain: fp.isMain,
        film: fp.film
          ? {
            filmId: fp.film.filmId,
            title: fp.film.title,
            originalTitle: fp.film.originalTitle,
            description: fp.film.description,
            releaseDate: fp.film.releaseDate,
            thumbUrl: fp.film.thumbUrl,
            // posterUrl: fd.film.posterUrl,
            filmImages: fp.film.filmImages?.map((img: FilmImage) => ({
              filmImageId: img.id,
              imageUrl: img.url,
            })),
            year: fp.film.year,
            slug: fp.film.slug,
            age: fp.film.ageCode,
            type: fp.film.typeCode,
            country: fp.film.countryCode,
            language: fp.film.langCode,
            publicStatus: fp.film.publicStatusCode,
          }
          : null,
        producer: fp.producer
          ? {
            producerId: fp.producer.producerId,
            producerName: fp.producer.producerName,
            slug: fp.producer.slug,
          }
          : null,
        createdAt: fp.createdAt,
        updatedAt: fp.updatedAt,
      }))

      return {
        EC: 1,
        EM: total > 0 ? "Get all film-producer relations successfully" : "No film-producer relations found",
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result,
      }
    } catch (error: any) {
      console.error("Error in getAllFilmProducers:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from getAllFilmProducers service",
      })
    }
  }

  async getFilmProducerById(id: number) {
    try {
      const filmProducer = await this.filmProducerRepo.findOne({
        where: { id },
        relations: ["film", 'film.filmImages', "producer"],
      })

      if (!filmProducer) return { EC: 0, EM: `FilmProducer ${id} not found!` }
      const result = this.formatFilmProducer(filmProducer)
      return { EC: 1, EM: "Get filmProducer successfully", result }
    } catch (error: any) {
      console.error("Error in getFilmProducerById:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from getFilmProducerById service",
      })
    }
  }

  async getProducersByFilm(filmId: string, query: any = {}) {
    try {
      query = query || {}
      const { filter, sort } = aqp(query)
      const page = Number.parseInt(query.page) || 1
      const limit = Number.parseInt(query.limit) || 5
      const skip = (page - 1) * limit

      delete filter.page
      delete filter.limit
      delete filter.skip
      delete filter.sort

      const order = sort || { producerName: "ASC" }

      const film = await this.filmRepo.findOne({
        where: { filmId },
        relations: ["filmProducers", "filmProducers.producer"],
      })

      if (!film) {
        return { EC: 0, EM: `Film ${filmId} not found!` }
      }

      let producers = film.filmProducers.map((fp) => ({
        producerId: fp.producer.producerId,
        producerName: fp.producer.producerName,
        slug: fp.producer.slug,
        isMain: fp.isMain,
      }))

      if (order) {
        const [key, dir] = Object.entries(order)[0]
        const producer = String(dir).toUpperCase() === "DESC" ? "DESC" : "ASC"
        producers = producers.sort((a, b) =>
          producer === "ASC" ? a[key]?.localeCompare(b[key]) : b[key]?.localeCompare(a[key]),
        )
      }

      const total = producers.length
      const paginated = producers.slice(skip, skip + limit)

      return {
        EC: 1,
        EM: "Get producers by film successfully",
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      }
      return { EC: 0, EM: 'Get directors by film successfully', producers };

    } catch (error: any) {
      console.error("Error in getProducersByFilm:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from getProducersByFilm service",
      })
    }
  }

  async getFilmsByProducer(producerId: number, query: any = {}) {
    try {
      query = query || {}
      const { filter, sort } = aqp(query)
      const page = Number.parseInt(query.page) || 1
      const limit = Number.parseInt(query.limit) || 12
      const skip = (page - 1) * limit

      delete filter.page
      delete filter.limit
      delete filter.skip
      delete filter.sort

      const order = sort || { createdAt: "DESC" }

      const producer = await this.producerRepo.findOne({
        where: { producerId },
        relations: [
          'filmProducers',
          'filmProducers.film',
          'filmProducers.film.filmImages',
          'filmProducers.film.filmGenres.genre',
          'filmProducers.film.age',],
      })

      if (!producer) {
        return { EC: 0, EM: `Producer ${producerId} not found!` }
      }

      let films = producer.filmProducers.map((fp) => fp.film)

      if (order) {
        const [key, dir] = Object.entries(order)[0]
        const direction = String(dir).toUpperCase()
        films = films.sort((a, b) =>
          direction === "ASC"
            ? String(a[key])?.localeCompare(String(b[key]))
            : String(b[key])?.localeCompare(String(a[key])),
        )
      }

      const total = films.length

      // Explicitly map the entity to a plain object to avoid serialization issues (empty objects)
      const paginated = films.slice(skip, skip + limit).map((film) => ({
        filmId: film.filmId,
        title: film.title,
        originalTitle: film.originalTitle,
        description: film.description,
        releaseDate: film.releaseDate,
        year: film.year,
        thumbUrl: film.thumbUrl,
        filmImages: film.filmImages?.map((img: FilmImage) => ({
          filmImageId: img.id,
          imageUrl: img.url,
        })),
        slug: film.slug,
        age: film.ageCode,
        type: film.typeCode,
        country: film.countryCode,
        language: film.langCode,
        publicStatus: film.publicStatusCode,
      }))

      return {
        EC: 1,
        EM: "Get films by producer successfully",
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        result: paginated,
      }
    } catch (error: any) {
      console.error("Error in getFilmsByProducer:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from getFilmsByProducer service",
      })
    }
  }

  async updateFilmProducer(id: number, dto: UpdateFilmProducerDto, user: IUser) {
    try {
      const relation = await this.filmProducerRepo.findOne({
        where: { id },
        relations: ["film", "producer"],
        select: ["id", "isMain"],
      })
      if (!relation) return { EC: 0, EM: `Relation ${id} not found!` }

      const targetFilmId = dto.filmId ?? relation.film.filmId
      const targetProducerId = dto.producerId ?? relation.producer.producerId

      const exists = await this.filmProducerRepo.findOne({
        where: {
          film: { filmId: targetFilmId },
          producer: { producerId: targetProducerId },
          id: Not(id),
        },
      })
      if (exists) return { EC: 0, EM: "This producer is already associated with this film!" }

      if (dto.filmId) {
        const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } })
        if (!film) return { EC: 0, EM: `Film ${dto.filmId} is invalid!` }
        relation.film = film
      }

      if (dto.producerId) {
        const producer = await this.producerRepo.findOne({
          where: { producerId: dto.producerId },
        })
        if (!producer) return { EC: 0, EM: `Producer ${dto.producerId} is invalid!` }
        relation.producer = producer
      }

      if (dto.isMain === true) {
        const mainExists = await this.filmProducerRepo.findOne({
          where: {
            film: { filmId: targetFilmId },
            isMain: true,
            id: Not(id),
          },
          relations: ["film"],
        })
        if (mainExists) return { EC: 0, EM: "Main producer already exists for this film!" }
      }

      if (dto.isMain !== undefined) relation.isMain = dto.isMain

      relation.updatedBy = user.userId

      await this.filmProducerRepo.save(relation)

      const data = await this.filmProducerRepo.findOne({
        where: { id },
        relations: ["film", "producer"],
      })

      const result = this.formatFilmProducer(data)
      return { EC: 1, EM: "Update film producer successfully", result }
    } catch (error: any) {
      console.error("Error in updateFilmProducer:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from updateFilmProducer service",
      })
    }
  }

  async deleteFilmProducer(id: number, user: IUser) {
    try {
      const deleteFilmProducer = await this.filmProducerRepo.findOne({ where: { id } })
      if (!deleteFilmProducer) return { EC: 0, EM: `FilmProducer ${id} not found!` }

      await this.filmProducerRepo.update(id, { deletedBy: user.userId })
      await this.filmProducerRepo.softDelete({ id })
      return { EC: 1, EM: "Delete film producer successfully" }
    } catch (error: any) {
      console.error("Error in deleteFilmProducer:", error.message)
      throw new InternalServerErrorException({
        EC: 0,
        EM: "Error from deleteFilmProducer service",
      })
    }
  }
}
