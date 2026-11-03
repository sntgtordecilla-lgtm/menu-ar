-- Create App Role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'menu_api_role') THEN
    CREATE ROLE menu_api_role NOLOGIN;
  END IF;
END
$$;

-- Enums
DO $$ BEGIN CREATE TYPE "user_role" AS ENUM('owner', 'manager', 'cashier', 'kitchen'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "table_session_status" AS ENUM('open', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "order_status" AS ENUM('draft', 'placed', 'accepted', 'in_progress', 'ready', 'served', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "payment_status" AS ENUM('created', 'pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "asset_status" AS ENUM('uploaded', 'validating', 'ready', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "mp_credential_mode" AS ENUM('oauth', 'custom_token'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables Creation
CREATE TABLE IF NOT EXISTS "restaurant_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "cuit" text NOT NULL,
  "timezone" text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  "brand" jsonb NOT NULL,
  "tip_options" jsonb NOT NULL,
  "tip_destination_mode" text NOT NULL DEFAULT 'ACCOUNTING_SEPARATION',
  "open_hours" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "auth_id" text UNIQUE,
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "role" "user_role" NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid REFERENCES "users"("id"),
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" text,
  "diff" jsonb,
  "ip" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tables" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "label" text NOT NULL,
  "qr_version" integer NOT NULL DEFAULT 1,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "table_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_id" uuid NOT NULL REFERENCES "tables"("id"),
  "status" "table_session_status" NOT NULL DEFAULT 'open',
  "opened_at" timestamp with time zone NOT NULL DEFAULT now(),
  "closed_at" timestamp with time zone,
  "session_secret_hash" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Partial Unique Index: Only 1 open session per table
CREATE UNIQUE INDEX IF NOT EXISTS "idx_one_open_session_per_table" ON "table_sessions" ("table_id") WHERE status = 'open';

CREATE TABLE IF NOT EXISTS "guests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_session_id" uuid NOT NULL REFERENCES "table_sessions"("id"),
  "display_name" text,
  "device_hash" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "menu_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assets_3d" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "glb_url" text,
  "usdz_url" text,
  "poster_url" text,
  "size_bytes" bigint,
  "real_scale" jsonb,
  "status" "asset_status" NOT NULL DEFAULT 'uploaded',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" uuid NOT NULL REFERENCES "menu_categories"("id"),
  "name" text NOT NULL,
  "description" text,
  "price_cents" bigint NOT NULL,
  "allergens" text[],
  "station" text NOT NULL DEFAULT 'kitchen',
  "available" boolean NOT NULL DEFAULT true,
  "asset_id" uuid REFERENCES "assets_3d"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_session_id" uuid NOT NULL REFERENCES "table_sessions"("id"),
  "status" "order_status" NOT NULL DEFAULT 'draft',
  "placed_at" timestamp with time zone,
  "cancel_reason" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id"),
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "guest_id" uuid REFERENCES "guests"("id"),
  "qty" integer NOT NULL DEFAULT 1,
  "unit_price_cents" bigint NOT NULL,
  "notes" text,
  "status" text NOT NULL DEFAULT 'placed',
  "station" text NOT NULL DEFAULT 'kitchen',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items" ("order_id");

CREATE TABLE IF NOT EXISTS "mp_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mode" "mp_credential_mode" NOT NULL,
  "mp_user_id" text,
  "access_token_enc" text NOT NULL,
  "refresh_token_enc" text,
  "expires_at" timestamp with time zone,
  "scopes" text[],
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_session_id" uuid NOT NULL REFERENCES "table_sessions"("id"),
  "mp_preference_id" text,
  "mp_payment_id" text,
  "status" "payment_status" NOT NULL DEFAULT 'created',
  "consumption_cents" bigint NOT NULL,
  "tip_cents" bigint NOT NULL DEFAULT 0,
  "total_cents" bigint NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chk_payment_total" CHECK (total_cents = consumption_cents + tip_cents)
);

CREATE TABLE IF NOT EXISTS "payment_allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" uuid NOT NULL REFERENCES "payments"("id"),
  "order_item_id" uuid NOT NULL REFERENCES "order_items"("id"),
  "amount_cents" bigint NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tips_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" uuid NOT NULL REFERENCES "payments"("id"),
  "amount_cents" bigint NOT NULL,
  "destination_ref" text,
  "status" text NOT NULL DEFAULT 'pending',
  "credited_at" timestamp with time zone,
  "distributed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" uuid NOT NULL REFERENCES "payments"("id"),
  "code" text NOT NULL UNIQUE,
  "issued_at" timestamp with time zone NOT NULL DEFAULT now(),
  "redeemed_at" timestamp with time zone,
  "redeemed_by" uuid REFERENCES "users"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" text NOT NULL,
  "event_id" text NOT NULL UNIQUE,
  "payload" jsonb NOT NULL,
  "received_at" timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at" timestamp with time zone,
  "error" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fiscal_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" uuid NOT NULL REFERENCES "payments"("id"),
  "provider" text NOT NULL DEFAULT 'STUB',
  "status" text NOT NULL DEFAULT 'pending',
  "cae" text,
  "number" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "menu_item_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "name" text NOT NULL,
  "price_delta_cents" bigint NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);


-- Row Level Security (RLS) - Enable & Force on ALL tables
ALTER TABLE "restaurant_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "restaurant_settings" FORCE ROW LEVEL SECURITY;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" FORCE ROW LEVEL SECURITY;

ALTER TABLE "tables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tables" FORCE ROW LEVEL SECURITY;

ALTER TABLE "table_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "table_sessions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guests" FORCE ROW LEVEL SECURITY;

ALTER TABLE "menu_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_categories" FORCE ROW LEVEL SECURITY;

ALTER TABLE "assets_3d" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets_3d" FORCE ROW LEVEL SECURITY;

ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_items" FORCE ROW LEVEL SECURITY;

ALTER TABLE "menu_item_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_item_options" FORCE ROW LEVEL SECURITY;

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" FORCE ROW LEVEL SECURITY;

ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" FORCE ROW LEVEL SECURITY;

ALTER TABLE "mp_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mp_credentials" FORCE ROW LEVEL SECURITY;

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;

ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_allocations" FORCE ROW LEVEL SECURITY;

ALTER TABLE "tips_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tips_ledger" FORCE ROW LEVEL SECURITY;

ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receipts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" FORCE ROW LEVEL SECURITY;

ALTER TABLE "fiscal_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_documents" FORCE ROW LEVEL SECURITY;

-- Default Deny / API Policies
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO menu_api_role;

DROP POLICY IF EXISTS api_role_all_policy ON "restaurant_settings";
CREATE POLICY api_role_all_policy ON "restaurant_settings" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "users";
CREATE POLICY api_role_all_policy ON "users" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "audit_log";
CREATE POLICY api_role_all_policy ON "audit_log" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "tables";
CREATE POLICY api_role_all_policy ON "tables" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "table_sessions";
CREATE POLICY api_role_all_policy ON "table_sessions" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "guests";
CREATE POLICY api_role_all_policy ON "guests" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "menu_categories";
CREATE POLICY api_role_all_policy ON "menu_categories" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "assets_3d";
CREATE POLICY api_role_all_policy ON "assets_3d" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "menu_items";
CREATE POLICY api_role_all_policy ON "menu_items" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "menu_item_options";
CREATE POLICY api_role_all_policy ON "menu_item_options" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "orders";
CREATE POLICY api_role_all_policy ON "orders" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "order_items";
CREATE POLICY api_role_all_policy ON "order_items" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "mp_credentials";
CREATE POLICY api_role_all_policy ON "mp_credentials" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "payments";
CREATE POLICY api_role_all_policy ON "payments" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "payment_allocations";
CREATE POLICY api_role_all_policy ON "payment_allocations" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "tips_ledger";
CREATE POLICY api_role_all_policy ON "tips_ledger" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "receipts";
CREATE POLICY api_role_all_policy ON "receipts" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "webhook_events";
CREATE POLICY api_role_all_policy ON "webhook_events" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS api_role_all_policy ON "fiscal_documents";
CREATE POLICY api_role_all_policy ON "fiscal_documents" FOR ALL TO menu_api_role USING (true) WITH CHECK (true);
