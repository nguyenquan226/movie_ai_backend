import * as fs from 'fs';
import * as path from 'path';

export function loadSeedData<T>(filename: string): T {
  const filePath = path.join(__dirname, '..', 'seed-data', filename);
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData) as T;
  } catch (error) {
    throw new Error(`Failed to load seed data from ${filename}: ${error.message}`);
  }
}
