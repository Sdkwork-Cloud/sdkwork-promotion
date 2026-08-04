# promotion database module

Reference contract for promotion capability tables under commerce platform bootstrap.

## Schema conventions

All promotion tables use the commerce platform **TEXT schema**:

- Identifiers (`id`, `tenant_id`, `organization_id`, foreign keys) are `TEXT`; the
  C-side SQL compares them with `tenant_id = CAST($1 AS TEXT)` so numeric gateway
  subjects bind cleanly.
- `status` columns are canonical **string state machines**:
  - offer / coupon stock / code: `active` | `disabled`
  - user coupon: `claimed` | `redeemed` | `expired` | `disabled` | `voided` | `cancelled`
  - discount application: `applied` | `settled` | `released` | `rolled_back`
  - code batch: `PENDING` | `GENERATING` | `READY`
- Amounts, quantities, and timestamps are stored as TEXT (`YYYY-MM-DD HH:MM:SS` UTC
  via `current_timestamp_string()` / `TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', ...)`).

## Initialization state

This module is in **initialization state** for greenfield deployments:

1. **Baseline** — `database/ddl/baseline/{engine}/0001_promotion_baseline.sql` contains the full DDL snapshot (including campaign, code batch, and distribution tables).
2. **Migrations** — `database/migrations/{engine}/` contains the post-baseline change chain:
   - `0002_marketing_admin.up.sql` — marketing admin surface (TEXT-aligned columns).
   - `0003_coupon_code_issue_mode.up.sql` — `promotion_coupon_stock.code_issue_mode`
     (`REALTIME` | `BATCH`) for pre-generated pool codes.
3. **Drift** — run `pnpm db:drift:check` before release.

The promotion module is registered as a federated commerce capability database:
`crates/sdkwork-promotion-database-host` exposes `database_module()`, and the Cloud
Router commerce runtime bootstraps it on the shared commerce pool together with
payment, order, and membership modules.

## Commands

```bash
pnpm run db:validate
pnpm run db:materialize:contract
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```
