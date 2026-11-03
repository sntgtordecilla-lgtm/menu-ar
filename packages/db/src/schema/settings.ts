import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const restaurantSettings = pgTable('restaurant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  cuit: text('cuit').notNull(),
  timezone: text('timezone').notNull().default('America/Argentina/Buenos_Aires'),
  brand: jsonb('brand').notNull().$type<{
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    tagline?: string;
  }>(),
  tipOptions: jsonb('tip_options').notNull().$type<{
    enabled: boolean;
    defaultPercentage: number;
    optionsPercentages: number[];
  }>(),
  tipDestinationMode: text('tip_destination_mode').notNull().default('ACCOUNTING_SEPARATION'),
  openHours: jsonb('open_hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
