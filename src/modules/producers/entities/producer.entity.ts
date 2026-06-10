import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
} from "typeorm"
import { FilmProducer } from "src/modules/film_producer/entities/film_producer.entity"

@Entity({ name: "producers" })
export class Producer {
  @PrimaryGeneratedColumn({ name: "producer_id" })
  producerId: number

  @Column({ name: "producer_name", type: "varchar", length: 100, unique: true })
  producerName: string

  @Column({ name: 'slug', type: 'varchar', length: 120, nullable: true })
  slug?: string;
  
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date

  @Column({ nullable: true })
  createdBy: number

  @Column({ nullable: true })
  updatedBy: number

  @Column({ nullable: true })
  deletedBy: number

  @OneToMany(() => FilmProducer,(filmProducer) => filmProducer.producer,)
  filmProducers: FilmProducer[]
}
