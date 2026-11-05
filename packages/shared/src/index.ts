import { z } from 'zod';

export const VERSION = '0.1.0';

export const RestaurantSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  timezone: z.string(),
  brand: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    logoUrl: z.string().optional(),
    tagline: z.string().optional(),
  }),
  tipOptions: z.object({
    enabled: z.boolean(),
    defaultPercentage: z.number(),
    optionsPercentages: z.array(z.number()),
  }),
  openHours: z.unknown().nullable(),
});

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  priceCents: z.number().int().nonnegative(),
  allergens: z.array(z.string()).nullable(),
});

export const MenuCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  position: z.number().int(),
  items: z.array(MenuItemSchema),
});

export const RestaurantMenuSchema = z.object({
  restaurant: RestaurantSchema,
  categories: z.array(MenuCategorySchema),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuCategory = z.infer<typeof MenuCategorySchema>;
export type RestaurantMenu = z.infer<typeof RestaurantMenuSchema>;

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

export function formatARS(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('Price in cents must be a safe integer');
  }

  return arsFormatter.format(cents / 100);
}
