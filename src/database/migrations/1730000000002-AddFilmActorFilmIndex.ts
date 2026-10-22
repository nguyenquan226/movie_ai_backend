import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFilmActorFilmIndex1730000000002 implements MigrationInterface {
  name = 'AddFilmActorFilmIndex1730000000002';
  transaction = false;

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_film_actors_film_id" ON "film_actors" ("film_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_film_actors_film_id"');
  }
}
