import { Producer } from "src/modules/producers/entities/producer.entity"
import { Film } from "src/modules/films/entities/film.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity({ name: "film_producers" })
export class FilmProducer {
  @PrimaryGeneratedColumn({ name: "film_producer_id" })
  id: number

  @Column({ name: "is_main" })
  isMain: boolean

  @ManyToOne(() => Film,(film) => film.filmProducers,{ onDelete: "CASCADE" },)
  @JoinColumn({ name: "film_id", referencedColumnName: "filmId" })
  film: Film

  @ManyToOne(() => Producer,(producer) => producer.filmProducers,{ onDelete: "CASCADE" },)
  @JoinColumn({ name: "producer_id", referencedColumnName: "producerId" })
  producer: Producer

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
  @Column({ nullable: true })
  createdBy: number
  @Column({ nullable: true })
  updatedBy: number
  @Column({ nullable: true })
  deletedBy: number
}
