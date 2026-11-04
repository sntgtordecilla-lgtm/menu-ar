import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseConnection } from '@menu-ar/db';
import { DATABASE_CONNECTION } from '../database/database.module';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly connection: DatabaseConnection,
  ) {}

  async check(): Promise<{ status: 'ok'; database: 'connected' }> {
    await this.connection.db.execute(sql`select 1`);
    return { status: 'ok', database: 'connected' };
  }
}
