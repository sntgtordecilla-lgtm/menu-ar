import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestaurantMenuSchema, type RestaurantMenu } from '@menu-ar/shared';
import type { Database } from '@menu-ar/db';
import { DATABASE_CONNECTION } from '../database/database.module';

const DEFAULT_RESTAURANT_SLUG = 'restaurante-ar';

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly database: Database,
    private readonly configService: ConfigService,
  ) {}

  async findBySlug(slug: string) {
    const configuredSlug = this.configService.get(
      'RESTAURANT_SLUG',
      DEFAULT_RESTAURANT_SLUG,
    );
    if (slug !== configuredSlug) {
      return null;
    }

    const { restaurantSettings } = await import('@menu-ar/db');
    const [restaurant] = await this.database
      .select({
        name: restaurantSettings.name,
        timezone: restaurantSettings.timezone,
        brand: restaurantSettings.brand,
        tipOptions: restaurantSettings.tipOptions,
        openHours: restaurantSettings.openHours,
      })
      .from(restaurantSettings)
      .limit(1);

    return restaurant ? { slug: configuredSlug, ...restaurant } : null;
  }

  async findMenuBySlug(slug: string): Promise<RestaurantMenu | null> {
    const restaurant = await this.findBySlug(slug);
    if (!restaurant) {
      return null;
    }

    const { menuCategories, menuItems } = await import('@menu-ar/db');
    const { asc, eq } = await import('drizzle-orm');
    const categories = await this.database
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        position: menuCategories.position,
      })
      .from(menuCategories)
      .where(eq(menuCategories.active, true))
      .orderBy(asc(menuCategories.position));
    const items = await this.database
      .select({
        id: menuItems.id,
        categoryId: menuItems.categoryId,
        name: menuItems.name,
        description: menuItems.description,
        priceCents: menuItems.priceCents,
        allergens: menuItems.allergens,
      })
      .from(menuItems)
      .where(eq(menuItems.available, true))
      .orderBy(asc(menuItems.name));

    return RestaurantMenuSchema.parse({
      restaurant,
      categories: categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.categoryId === category.id),
      })),
    });
  }
}
