import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFilmListIndexes1730000000001 implements MigrationInterface {
  name = 'AddFilmListIndexes1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_films_created_at" ON "films" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_films_deleted_at" ON "films" ("deletedAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_films_is_vip" ON "films" ("isVip")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_films_is_vip"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_films_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_films_created_at"`);
  }
}
