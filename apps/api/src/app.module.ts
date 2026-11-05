import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [DatabaseModule, HealthModule, RestaurantsModule],
})
export class AppModule {}
