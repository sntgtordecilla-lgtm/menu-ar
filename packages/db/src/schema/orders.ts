import { pgTable, uuid, text, integer, bigint, timestamp } from 'drizzle-orm/pg-core';
import { orderStatusEnum } from './enums';
import { tableSessions, guests } from './tables';
import { menuItems } from './menu';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableSessionId: uuid('table_session_id').references(() => tableSessions.id).notNull(),
  status: orderStatusEnum('status').notNull().default('draft'),
  placedAt: timestamp('placed_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id).notNull(),
  guestId: uuid('guest_id').references(() => guests.id),
  qty: integer('qty').notNull().default(1),
  unitPriceCents: bigint('unit_price_cents', { mode: 'number' }).notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('placed'),
  station: text('station').notNull().default('kitchen'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
