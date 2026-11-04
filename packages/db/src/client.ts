import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** Creates an isolated database connection using the URL supplied by the application. */
export function createDatabase(connectionString: string) {
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });

  return { db, queryClient };
}

export type DatabaseConnection = ReturnType<typeof createDatabase>;
export type Database = DatabaseConnection['db'];
