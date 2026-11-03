import { pgTable, uuid, text, bigint, timestamp } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, mpCredentialModeEnum } from './enums';
import { tableSessions } from './tables';
import { orderItems } from './orders';
import { users } from './users';

export const mpCredentials = pgTable('mp_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  mode: mpCredentialModeEnum('mode').notNull(),
  mpUserId: text('mp_user_id'),
  accessTokenEnc: text('access_token_enc').notNull(),
  refreshTokenEnc: text('refresh_token_enc'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scopes: text('scopes').array(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableSessionId: uuid('table_session_id').references(() => tableSessions.id).notNull(),
  mpPreferenceId: text('mp_preference_id'),
  mpPaymentId: text('mp_payment_id'),
  status: paymentStatusEnum('status').notNull().default('created'),
  consumptionCents: bigint('consumption_cents', { mode: 'number' }).notNull(),
  tipCents: bigint('tip_cents', { mode: 'number' }).notNull().default(0),
  totalCents: bigint('total_cents', { mode: 'number' }).notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => payments.id).notNull(),
  orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tipsLedger = pgTable('tips_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => payments.id).notNull(),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  destinationRef: text('destination_ref'),
  status: text('status').notNull().default('pending'),
  creditedAt: timestamp('credited_at', { withTimezone: true }),
  distributedAt: timestamp('distributed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => payments.id).notNull(),
  code: text('code').notNull().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  redeemedBy: uuid('redeemed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
