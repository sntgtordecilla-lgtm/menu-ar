import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
    }),
    DatabaseModule,
    HealthModule,
    RestaurantsModule,
  ],
})
export class AppModule {}
