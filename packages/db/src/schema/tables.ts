import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { tableSessionStatusEnum } from './enums';

export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  qrVersion: integer('qr_version').notNull().default(1),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tableSessions = pgTable('table_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id').references(() => tables.id).notNull(),
  status: tableSessionStatusEnum('status').notNull().default('open'),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  sessionSecretHash: text('session_secret_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableSessionId: uuid('table_session_id').references(() => tableSessions.id).notNull(),
  displayName: text('display_name'),
  deviceHash: text('device_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
