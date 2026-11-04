import { Global, Module, OnModuleDestroy, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase, DatabaseConnection } from '@menu-ar/db';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DatabaseConnection => {
        const connectionString = config.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL must be configured to start the API.');
        }

        return createDatabase(connectionString);
      },
    },
    DatabaseConnectionLifecycle,
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}

@Injectable()
class DatabaseConnectionLifecycle implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly connection: DatabaseConnection,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.connection.queryClient.end({ timeout: 5 });
  }
}
