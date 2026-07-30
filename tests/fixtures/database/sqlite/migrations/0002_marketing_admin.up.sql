-- sdkwork:migration
-- id: 0002_marketing_admin
-- engine: sqlite
-- module: promotion
-- purpose: campaign, code batch, and direct coupon distribution administration
-- reversible: false
-- transactional: true

ALTER TABLE promotion_offer ADD COLUMN campaign_id BIGINT;
ALTER TABLE promotion_code ADD COLUMN code_batch_id BIGINT;

CREATE TABLE IF NOT EXISTS promotion_campaign (
    id BIGINT PRIMARY KEY, uuid TEXT NOT NULL UNIQUE, tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0, campaign_no TEXT NOT NULL, campaign_code TEXT,
    display_name TEXT NOT NULL, description TEXT, channel_scope TEXT NOT NULL DEFAULT 'ALL',
    audience_scope TEXT NOT NULL DEFAULT 'ALL', starts_at TEXT NOT NULL, ends_at TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT', version BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    CONSTRAINT uk_promotion_campaign_no UNIQUE (tenant_id, campaign_no),
    CONSTRAINT chk_promotion_campaign_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS promotion_code_batch (
    id BIGINT PRIMARY KEY, uuid TEXT NOT NULL UNIQUE, tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0, stock_id BIGINT NOT NULL, offer_id BIGINT NOT NULL,
    offer_version_id BIGINT NOT NULL, batch_no TEXT NOT NULL, code_type TEXT NOT NULL,
    requested_quantity BIGINT NOT NULL, generated_quantity BIGINT NOT NULL DEFAULT 0,
    code_length INTEGER NOT NULL DEFAULT 16, code_prefix TEXT NOT NULL DEFAULT '', starts_at TEXT,
    expires_at TEXT, status TEXT NOT NULL DEFAULT 'PENDING', idempotency_key TEXT NOT NULL,
    created_by BIGINT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    CONSTRAINT uk_promotion_code_batch_no UNIQUE (tenant_id, batch_no),
    CONSTRAINT uk_promotion_code_batch_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT chk_promotion_code_batch_quantity CHECK (requested_quantity > 0 AND generated_quantity BETWEEN 0 AND requested_quantity),
    CONSTRAINT chk_promotion_code_batch_length CHECK (code_length BETWEEN 12 AND 32)
);

CREATE TABLE IF NOT EXISTS promotion_distribution_task (
    id BIGINT PRIMARY KEY, uuid TEXT NOT NULL UNIQUE, tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0, stock_id BIGINT NOT NULL, offer_id BIGINT NOT NULL,
    offer_version_id BIGINT NOT NULL, task_no TEXT NOT NULL, distribution_type TEXT NOT NULL DEFAULT 'DIRECT',
    requested_quantity BIGINT NOT NULL, succeeded_quantity BIGINT NOT NULL DEFAULT 0,
    failed_quantity BIGINT NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT NOT NULL, created_by BIGINT NOT NULL, started_at TEXT, completed_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    CONSTRAINT uk_promotion_distribution_task_no UNIQUE (tenant_id, task_no),
    CONSTRAINT uk_promotion_distribution_task_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT chk_promotion_distribution_task_quantities CHECK (requested_quantity > 0 AND succeeded_quantity >= 0 AND failed_quantity >= 0 AND succeeded_quantity + failed_quantity <= requested_quantity)
);

CREATE TABLE IF NOT EXISTS promotion_distribution_record (
    id BIGINT PRIMARY KEY, uuid TEXT NOT NULL UNIQUE, tenant_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL DEFAULT 0, task_id BIGINT NOT NULL, owner_user_id BIGINT NOT NULL,
    user_coupon_id BIGINT, status TEXT NOT NULL, failure_code TEXT, failure_detail TEXT,
    created_at TEXT NOT NULL,
    CONSTRAINT uk_promotion_distribution_record_target UNIQUE (tenant_id, task_id, owner_user_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_campaign_tenant_status ON promotion_campaign (tenant_id, organization_id, status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_offer_campaign ON promotion_offer (tenant_id, organization_id, campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_code_batch_stock ON promotion_code_batch (tenant_id, organization_id, stock_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_code_batch ON promotion_code (tenant_id, code_batch_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_distribution_task_stock ON promotion_distribution_task (tenant_id, organization_id, stock_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_distribution_record_task ON promotion_distribution_record (tenant_id, task_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_distribution_record_owner ON promotion_distribution_record (tenant_id, owner_user_id, created_at DESC);
