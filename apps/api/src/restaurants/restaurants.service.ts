import { Injectable, NotFoundException, ServiceUnavailableException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DatabaseConnection, restaurantSettings } from '@menu-ar/db';
import { DATABASE_CONNECTION } from '../database/database.module';

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly connection: DatabaseConnection,
    private readonly config: ConfigService,
  ) {}

  async findBySlug(slug: string) {
    const configuredSlug = this.config.get<string>('RESTAURANT_SLUG');
    if (!configuredSlug) {
      throw new ServiceUnavailableException('RESTAURANT_SLUG is not configured.');
    }
    if (slug !== configuredSlug) {
      throw new NotFoundException('Restaurant not found.');
    }

    const [restaurant] = await this.connection.db
      .select({
        name: restaurantSettings.name,
        timezone: restaurantSettings.timezone,
        brand: restaurantSettings.brand,
        tipOptions: restaurantSettings.tipOptions,
        openHours: restaurantSettings.openHours,
      })
      .from(restaurantSettings)
      .limit(1);

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found.');
    }

    return { slug: configuredSlug, ...restaurant };
  }
}
