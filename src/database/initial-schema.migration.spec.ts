import { CreateInitialSchema1729999999999 } from './migrations/1729999999999-CreateInitialSchema';

describe('CreateInitialSchema migration', () => {
  it('creates the entity schema on a fresh database', async () => {
    const queryRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ films_table: null }])
        .mockResolvedValue([]),
    };
    const migration = new CreateInitialSchema1729999999999();

    await migration.up(queryRunner as any);

    expect(queryRunner.query).toHaveBeenCalledWith(
      'INSERT INTO "chillflix_schema_bootstrap" ("id", "schema_created") VALUES (1, $1)',
      [true],
    );
    expect(queryRunner.query.mock.calls.some(([sql]) => sql.includes('CREATE TABLE "films"'))).toBe(
      true,
    );
  });

  it('adopts an existing synchronized database without replaying create DDL', async () => {
    const queryRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ films_table: 'films' }])
        .mockResolvedValue([]),
    };
    const migration = new CreateInitialSchema1729999999999();

    await migration.up(queryRunner as any);

    expect(queryRunner.query).toHaveBeenCalledWith(
      'INSERT INTO "chillflix_schema_bootstrap" ("id", "schema_created") VALUES (1, $1)',
      [false],
    );
    expect(queryRunner.query.mock.calls.some(([sql]) => sql.includes('CREATE TABLE "films"'))).toBe(
      false,
    );
  });

  it('does not drop an adopted schema when reverted', async () => {
    const queryRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ schema_created: false }])
        .mockResolvedValue([]),
    };

    await new CreateInitialSchema1729999999999().down(queryRunner as any);

    expect(queryRunner.query).toHaveBeenCalledTimes(2);
    expect(queryRunner.query).toHaveBeenLastCalledWith(
      'DROP TABLE IF EXISTS "chillflix_schema_bootstrap"',
    );
  });

  it('drops the created schema with cascade before removing enum types', async () => {
    const queryRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ schema_created: true }])
        .mockResolvedValue([]),
    };

    await new CreateInitialSchema1729999999999().down(queryRunner as any);

    const statements = queryRunner.query.mock.calls.map(([sql]) => sql);
    const lastTableDrop = statements.findIndex((sql) => sql.includes('DROP TABLE IF EXISTS "markdown"'));
    const firstTypeDrop = statements.findIndex((sql) => sql.includes('DROP TYPE IF EXISTS'));
    expect(lastTableDrop).toBeGreaterThan(-1);
    expect(firstTypeDrop).toBeGreaterThan(lastTableDrop);
    expect(statements).toContain('DROP TABLE IF EXISTS "films" CASCADE');
  });
});
