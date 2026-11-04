import { createDatabase } from './client';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set before running database migrations.');
  }

  const { queryClient } = createDatabase(connectionString);
  console.log('Running database migrations...');
  const migrationPath = path.join(__dirname, 'migrations', '0000_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await queryClient.unsafe(sql);
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exitCode = 1;
  } finally {
    await queryClient.end();
  }
}

void runMigrations();
