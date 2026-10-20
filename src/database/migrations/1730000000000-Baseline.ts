import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1730000000000 implements MigrationInterface {
  name = 'Baseline1730000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Baseline for an existing schema previously managed by TypeORM synchronize.
    // Future schema changes must be generated with: npm run migration:generate
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
