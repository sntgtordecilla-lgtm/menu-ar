import { relations } from 'drizzle-orm';
import { users } from './users';
import { auditLog } from './audit';
import { tables, tableSessions, guests } from './tables';
import { menuCategories, menuItems, menuItemOptions } from './menu';
import { assets3d } from './assets';
import { orders, orderItems } from './orders';
import { payments, paymentAllocations, tipsLedger, receipts } from './payments';
import { fiscalDocuments } from './fiscal';

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLog),
  redeemedReceipts: many(receipts),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorId],
    references: [users.id],
  }),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  sessions: many(tableSessions),
}));

export const tableSessionsRelations = relations(tableSessions, ({ one, many }) => ({
  table: one(tables, {
    fields: [tableSessions.tableId],
    references: [tables.id],
  }),
  guests: many(guests),
  orders: many(orders),
  payments: many(payments),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  session: one(tableSessions, {
    fields: [guests.tableSessionId],
    references: [tableSessions.id],
  }),
  orderItems: many(orderItems),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const assets3dRelations = relations(assets3d, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  asset: one(assets3d, {
    fields: [menuItems.assetId],
    references: [assets3d.id],
  }),
  options: many(menuItemOptions),
  orderItems: many(orderItems),
}));

export const menuItemOptionsRelations = relations(menuItemOptions, ({ one }) => ({
  item: one(menuItems, {
    fields: [menuItemOptions.itemId],
    references: [menuItems.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  session: one(tableSessions, {
    fields: [orders.tableSessionId],
    references: [tableSessions.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  guest: one(guests, {
    fields: [orderItems.guestId],
    references: [guests.id],
  }),
  paymentAllocations: many(paymentAllocations),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  session: one(tableSessions, {
    fields: [payments.tableSessionId],
    references: [tableSessions.id],
  }),
  allocations: many(paymentAllocations),
  tips: many(tipsLedger),
  receipts: many(receipts),
  fiscalDocuments: many(fiscalDocuments),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentAllocations.paymentId],
    references: [payments.id],
  }),
  orderItem: one(orderItems, {
    fields: [paymentAllocations.orderItemId],
    references: [orderItems.id],
  }),
}));

export const tipsLedgerRelations = relations(tipsLedger, ({ one }) => ({
  payment: one(payments, {
    fields: [tipsLedger.paymentId],
    references: [payments.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  payment: one(payments, {
    fields: [receipts.paymentId],
    references: [payments.id],
  }),
  redeemedByUser: one(users, {
    fields: [receipts.redeemedBy],
    references: [users.id],
  }),
}));

export const fiscalDocumentsRelations = relations(fiscalDocuments, ({ one }) => ({
  payment: one(payments, {
    fields: [fiscalDocuments.paymentId],
    references: [payments.id],
  }),
}));
