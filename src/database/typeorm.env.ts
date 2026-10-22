export function shouldSynchronize(nodeEnv?: string, dbSynchronize?: string): boolean {
  if (nodeEnv === 'production') {
    return false;
  }
  if (dbSynchronize === 'true') {
    return true;
  }
  if (dbSynchronize === 'false') {
    return false;
  }
  return nodeEnv !== 'production';
}

export function shouldRunMigrations(nodeEnv?: string, dbMigrationsRun?: string): boolean {
  if (nodeEnv === 'production') {
    return true;
  }
  if (dbMigrationsRun === 'true') {
    return true;
  }
  if (dbMigrationsRun === 'false') {
    return false;
  }
  return nodeEnv === 'production';
}
