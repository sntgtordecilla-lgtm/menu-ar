import { pgTable, uuid, text, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { assetStatusEnum } from './enums';

export const assets3d = pgTable('assets_3d', {
  id: uuid('id').primaryKey().defaultRandom(),
  glbUrl: text('glb_url'),
  usdzUrl: text('usdz_url'),
  posterUrl: text('poster_url'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  realScale: jsonb('real_scale').$type<{ x: number; y: number; z: number }>(),
  status: assetStatusEnum('status').notNull().default('uploaded'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
