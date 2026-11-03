import { pgTable, uuid, text, integer, boolean, bigint, timestamp } from 'drizzle-orm/pg-core';
import { assets3d } from './assets';

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => menuCategories.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: bigint('price_cents', { mode: 'number' }).notNull(),
  allergens: text('allergens').array(),
  station: text('station').notNull().default('kitchen'),
  available: boolean('available').notNull().default(true),
  assetId: uuid('asset_id').references(() => assets3d.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const menuItemOptions = pgTable('menu_item_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').references(() => menuItems.id).notNull(),
  name: text('name').notNull(),
  priceDeltaCents: bigint('price_delta_cents', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
