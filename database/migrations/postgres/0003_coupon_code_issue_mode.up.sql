-- sdkwork:migration
-- id: 0003_coupon_code_issue_mode
-- engine: postgres
-- module: promotion
-- purpose: mark coupon stock code issuance mode (realtime claim code vs pre-generated batch pool)
-- reversible: false
-- transactional: true

ALTER TABLE promotion_coupon_stock ADD COLUMN IF NOT EXISTS code_issue_mode VARCHAR(16) NOT NULL DEFAULT 'REALTIME';
