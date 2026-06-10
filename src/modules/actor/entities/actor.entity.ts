import { join } from 'path';
import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { FilmActor } from 'src/modules/film_actor/entities/film_actor.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'actors' })
export class Actor {
  @PrimaryGeneratedColumn({ name: 'actor_id' })
  actorId: number;

  @Column({ name: 'actor_name', type: 'varchar', length: 100 })
  actorName: string;

  @Column({ name: 'slug', type: 'varchar', length: 120, nullable: true })
  slug?: string;

  @Column({ name: 'shortBio', type: 'text', nullable: true })
  shortBio?: string;

  @Column({ name: 'gender_code', type: 'varchar', length: 10 })
  genderCode?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ name: 'nationality_code', type: 'varchar', length: 10, nullable: true })
  nationalityCode?: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;
  @Column({ nullable: true })
  createdBy: number;
  @Column({ nullable: true })
  updatedBy: number;
  @Column({ nullable: true })
  deletedBy: number;
  @ManyToOne(() => AllCode, (allcode) => allcode.actorGender)
  @JoinColumn({ name: 'gender_code', referencedColumnName: 'keyMap' })
  genderActor: AllCode;
  @ManyToOne(() => AllCode, (allcode) => allcode.actorNationality)
  @JoinColumn({ name: 'nationality_code', referencedColumnName: 'keyMap' })
  nationalityActor: AllCode;
  @OneToMany(() => FilmActor, (filmActor) => filmActor.actor)
  filmActors: FilmActor[];
}
