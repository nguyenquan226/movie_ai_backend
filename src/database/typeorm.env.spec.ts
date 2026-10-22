import { shouldRunMigrations, shouldSynchronize } from './typeorm.env';

describe('TypeORM environment policy', () => {
  it('always disables synchronize in production, even when explicitly requested', () => {
    expect(shouldSynchronize('production', 'true')).toBe(false);
  });

  it('allows development synchronization to be configured and defaults it on', () => {
    expect(shouldSynchronize('development')).toBe(true);
    expect(shouldSynchronize('development', 'false')).toBe(false);
  });

  it('runs migrations by default in production', () => {
    expect(shouldRunMigrations('production')).toBe(true);
    expect(shouldRunMigrations('production', 'false')).toBe(true);
  });
});
