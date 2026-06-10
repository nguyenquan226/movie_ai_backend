import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { AllCode } from 'src/modules/all-codes/entities/all-code.entity';
import { FilmDirector } from 'src/modules/film_director/entities/film_director.entity';

@Entity({ name: 'directors' })
export class Director {
  @PrimaryGeneratedColumn({ name: 'director_id' })
  directorId: number;
  @Column({ name: 'director_name', type: 'varchar', length: 100 })
  directorName: string;
  @Column({ name: 'slug', type: 'varchar', length: 120, nullable: true })
  slug?: string;
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;
  @Column({ name: 'gender_code', type: 'varchar', length: 10 })
  genderCode?: string;
  @Column({ name: 'story', type: 'text', nullable: true })
  story?: string;
  @Column({ name: 'avatarUrl', type: 'text', nullable: true })
  avatarUrl?: string;
  @Column({ name: 'nationality_code', type: 'varchar', nullable: true })
  nationalityCode?: string;
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
  @ManyToOne(() => AllCode, (allcode) => allcode.directorGender)
  @JoinColumn({ name: 'gender_code', referencedColumnName: 'keyMap' })
  genderCodeRL: AllCode;

  @ManyToOne(() => AllCode, (allcode) => allcode.directorNationality)
  @JoinColumn({ name: 'nationality_code', referencedColumnName: 'keyMap' })
  nationalityCodeRL: AllCode;

  @OneToMany(() => FilmDirector, (filmDirector) => filmDirector.director)
  filmDirectors: FilmDirector[];
}
