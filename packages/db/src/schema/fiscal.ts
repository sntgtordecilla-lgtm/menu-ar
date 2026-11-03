import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { payments } from './payments';

export const fiscalDocuments = pgTable('fiscal_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => payments.id).notNull(),
  provider: text('provider').notNull().default('STUB'),
  status: text('status').notNull().default('pending'),
  cae: text('cae'),
  number: text('number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
