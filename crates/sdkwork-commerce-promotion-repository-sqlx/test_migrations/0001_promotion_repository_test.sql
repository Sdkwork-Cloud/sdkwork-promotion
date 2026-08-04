-- Promotion repository contract test schema.
-- Mirrors database/ddl/baseline/postgres/0001_promotion_baseline.sql (commerce TEXT schema)
-- plus database/migrations/postgres/0002/0003 so repository tests run against the
-- canonical production DDL instead of a divergent test-only shape.

CREATE TABLE IF NOT EXISTS commerce_idempotency_key (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT,
  status TEXT NOT NULL,
  locked_until TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, scope, idempotency_key)
);

CREATE TABLE IF NOT EXISTS commerce_account (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  owner_user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  currency_code TEXT,
  available_amount TEXT NOT NULL DEFAULT '0',
  frozen_amount TEXT NOT NULL DEFAULT '0',
  version INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, owner_user_id, asset_type, currency_code)
);

CREATE TABLE IF NOT EXISTS commerce_account_ledger_entry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  account_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount TEXT NOT NULL,
  balance_after TEXT NOT NULL,
  business_type TEXT NOT NULL,
  transaction_no TEXT NOT NULL,
  request_no TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  remark TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, transaction_no)
);

CREATE TABLE IF NOT EXISTS commerce_billing_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  owner_user_id TEXT NOT NULL,
  history_no TEXT NOT NULL,
  history_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  amount TEXT NOT NULL DEFAULT '0',
  currency_code TEXT,
  points_delta INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  reference_no TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  related_order_id TEXT,
  related_order_no TEXT,
  payment_method TEXT,
  occurred_at TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, history_no),
  UNIQUE (tenant_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS commerce_order (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  order_no TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, order_no)
);

CREATE TABLE IF NOT EXISTS promotion_campaign (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  campaign_no TEXT NOT NULL,
  campaign_code TEXT,
  display_name TEXT NOT NULL,
  description TEXT,
  channel_scope TEXT NOT NULL DEFAULT 'ALL',
  audience_scope TEXT NOT NULL DEFAULT 'ALL',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, campaign_no)
);

CREATE TABLE IF NOT EXISTS promotion_offer (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  offer_no TEXT NOT NULL,
  offer_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  offer_type TEXT NOT NULL,
  audience_scope TEXT NOT NULL,
  combinability TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  current_offer_version_id TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, offer_no),
  UNIQUE (tenant_id, organization_id, offer_code)
);

CREATE TABLE IF NOT EXISTS promotion_offer_version (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  offer_id TEXT NOT NULL,
  version_no TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value TEXT NOT NULL,
  minimum_amount TEXT NOT NULL DEFAULT '0',
  maximum_discount_amount TEXT,
  currency_code TEXT,
  rule_json TEXT NOT NULL,
  stack_rule_json TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, offer_id, version_no)
);

CREATE TABLE IF NOT EXISTS promotion_coupon_stock (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  stock_no TEXT NOT NULL,
  display_name TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  stock_type TEXT NOT NULL,
  code_issue_mode TEXT NOT NULL DEFAULT 'REALTIME',
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  total_quantity INTEGER,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  claimed_quantity INTEGER NOT NULL DEFAULT 0,
  redeemed_quantity INTEGER NOT NULL DEFAULT 0,
  locked_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  claim_starts_at TEXT,
  claim_ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, stock_no)
);

CREATE TABLE IF NOT EXISTS promotion_code_batch (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  stock_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  code_type TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  generated_quantity INTEGER NOT NULL DEFAULT 0,
  code_length INTEGER NOT NULL DEFAULT 16,
  code_prefix TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  idempotency_key TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, batch_no),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS promotion_code (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  code_no TEXT NOT NULL,
  code_batch_id TEXT,
  stock_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  promotion_code TEXT NOT NULL,
  code_type TEXT NOT NULL,
  max_claims INTEGER NOT NULL DEFAULT 1,
  claimed_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  starts_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code_no),
  UNIQUE (tenant_id, promotion_code)
);

CREATE TABLE IF NOT EXISTS promotion_user_coupon (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  coupon_no TEXT NOT NULL,
  stock_id TEXT NOT NULL,
  code_id TEXT,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  owner_user_id TEXT,
  coupon_code TEXT NOT NULL,
  status TEXT NOT NULL,
  claimed_at TEXT,
  valid_from TEXT,
  expires_at TEXT,
  redeemed_at TEXT,
  disabled_at TEXT,
  request_no TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, coupon_no),
  UNIQUE (tenant_id, coupon_code)
);

CREATE TABLE IF NOT EXISTS promotion_coupon_ledger_entry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  ledger_no TEXT NOT NULL,
  user_coupon_id TEXT,
  stock_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  subject_type TEXT,
  subject_id TEXT,
  direction TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  business_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  request_no TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, ledger_no),
  UNIQUE (tenant_id, request_no)
);

CREATE TABLE IF NOT EXISTS promotion_distribution_task (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  stock_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  task_no TEXT NOT NULL,
  distribution_type TEXT NOT NULL DEFAULT 'DIRECT',
  requested_quantity INTEGER NOT NULL,
  succeeded_quantity INTEGER NOT NULL DEFAULT 0,
  failed_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  idempotency_key TEXT NOT NULL,
  created_by TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, task_no),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS promotion_distribution_record (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  task_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  user_coupon_id TEXT,
  status TEXT NOT NULL,
  failure_code TEXT,
  failure_detail TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, task_id, owner_user_id)
);

CREATE TABLE IF NOT EXISTS promotion_discount_application (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  application_no TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  offer_version_id TEXT NOT NULL,
  user_coupon_id TEXT,
  order_id TEXT NOT NULL,
  order_no TEXT,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  discount_amount TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  status TEXT NOT NULL,
  request_no TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  rolled_back_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, application_no),
  UNIQUE (tenant_id, order_id, user_coupon_id)
);
