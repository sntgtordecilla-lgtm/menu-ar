import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'cashier', 'kitchen']);

export const tableSessionStatusEnum = pgEnum('table_session_status', ['open', 'closed']);

export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'placed',
  'accepted',
  'in_progress',
  'ready',
  'served',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back',
]);

export const assetStatusEnum = pgEnum('asset_status', ['uploaded', 'validating', 'ready', 'failed']);

export const mpCredentialModeEnum = pgEnum('mp_credential_mode', ['oauth', 'custom_token']);
