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

1. **Baseline** — `database/ddl/baseline/{engine}/0001_promotion_baseline.sql` contains the full DDL snapshot.
2. **Migrations** — `database/migrations/{engine}/` is reserved for post-GA incremental schema changes only. It is intentionally empty at initialization.
3. **Drift** — run `pnpm db:drift:check` before release.

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
