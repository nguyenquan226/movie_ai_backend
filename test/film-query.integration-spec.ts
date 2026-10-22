import { DataSource } from 'typeorm';
import { Film } from '../src/modules/films/entities/film.entity';
import { join } from 'path';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('Film relations PostgreSQL integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const databaseName = new URL(databaseUrl!).pathname.replace(/^\//, '');
    if (!databaseName.endsWith('_test')) {
      throw new Error('TEST_DATABASE_URL must point to a database whose name ends with _test');
    }

    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [join(process.cwd(), 'src/modules/**/*.entity.ts')],
      migrations: [join(process.cwd(), 'src/database/migrations/*.ts')],
      synchronize: false,
      dropSchema: true,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('executes a selected join query for films, genres, and actors', async () => {
    await dataSource.query(
      `INSERT INTO "all_code" ("keyMap", "type", "valueVi") VALUES
        ('AGE', 'AGE', 'Adult'), ('TYPE', 'TYPE', 'Movie'),
        ('COUNTRY', 'COUNTRY', 'Test'), ('LANG', 'LANG', 'Test'),
        ('PUBLIC', 'PUBLIC', 'Public'), ('GENRE', 'GENRE', 'Drama'),
        ('GENDER', 'GENDER', 'Unknown')`,
    );
    const [{ actor_id: actorId }] = await dataSource.query(
      `INSERT INTO "actors" ("actor_name", "gender_code") VALUES ('Test Actor', 'GENDER') RETURNING "actor_id"`,
    );
    await dataSource.query(
      `INSERT INTO "films" ("originalTitle", "title", "description", "releaseDate", "year", "thumbUrl", "slug", "ageCode", "typeCode", "countryCode", "langCode", "publicStatusCode")
       SELECT 'Original ' || n, 'Film ' || n, 'Fixture description', DATE '2020-01-01', '2020', 'thumb', 'film-' || n, 'AGE', 'TYPE', 'COUNTRY', 'LANG', 'PUBLIC'
       FROM generate_series(1, 1000) AS n`,
    );
    await dataSource.query(
      `INSERT INTO "film_genre" ("filmId", "genreCode") SELECT "filmId", 'GENRE' FROM "films"`,
    );
    await dataSource.query(
      `INSERT INTO "film_actors" ("film_id", "actor_id", "character_name") SELECT "filmId", $1, 'Lead' FROM "films"`,
      [actorId],
    );

    const query = dataSource
      .getRepository(Film)
      .createQueryBuilder('film')
      .leftJoinAndSelect('film.filmGenres', 'filmGenre')
      .leftJoinAndSelect('filmGenre.genre', 'genre')
      .leftJoinAndSelect('film.filmActors', 'filmActor')
      .leftJoinAndSelect('filmActor.actor', 'actor')
      .where('film.deletedAt IS NULL')
      .orderBy('film.createdAt', 'DESC')
      .take(20);
    const [sql, parameters] = query.getQueryAndParameters();
    const explain = await dataSource.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`, parameters);
    const queryPlan = explain.map((row: { 'QUERY PLAN': string }) => row['QUERY PLAN']).join('\n');
    expect(queryPlan).toContain('Execution Time:');
    console.log(`Film relation query plan:\n${queryPlan}`);

    const films = await query.getMany();
    expect(films).toHaveLength(20);
    expect(films[0].filmGenres[0].genre.keyMap).toBe('GENRE');
    expect(films[0].filmActors[0].actor.actorName).toBe('Test Actor');
  });
});
