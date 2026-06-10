import { Actor } from 'src/modules/actor/entities/actor.entity';
import { Director } from 'src/modules/directors/entities/director.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Film } from 'src/modules/films/entities/film.entity';
import { FilmGenre } from 'src/modules/films/entities/film_genre.entity';
import { SubscriptionPlan } from 'src/modules/subscription-plans/entities/subscription-plan.entity';

@Entity()
export class AllCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  keyMap: string;

  @Column({ nullable: false })
  type: string;

  @Column({ nullable: true })
  valueEn: string;

  @Column({ nullable: false })
  valueVi: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.gender)
  userGender: User[];

  @OneToMany(() => User, (user) => user.status)
  userStatus: User[];

  @OneToMany(() => Film, (film) => film.language)
  filmLanguage: Film[];

  @OneToMany(() => Film, (film) => film.publicStatus)
  filmPublicStatus: Film[];

  @OneToMany(() => Film, (film) => film.country)
  filmCountry: Film[];

  @OneToMany(() => Film, (film) => film.age)
  filmAge: Film[];

  @OneToMany(() => Film, (film) => film.type)
  filmType: Film[];

  @OneToMany(() => FilmGenre, (filmGenre) => filmGenre.genre)
  filmGenres: FilmGenre[];

  @OneToMany(() => Director, (director) => director.genderCode)
  directorGender: Director[];

  @OneToMany(() => Director, (director) => director.nationalityCode)
  directorNationality: Director[];

  @OneToMany(() => Actor, (actor) => actor.genderCode)
  actorGender: Actor[];

  @OneToMany(() => Actor, (actor) => actor.nationalityCode)
  actorNationality: Actor[];

  @OneToMany(() => SubscriptionPlan, (plan) => plan.durationInfo)
  planDuration: SubscriptionPlan[];
}
