# Repository Guidelines

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root.

## Capability Identity

- Domain: `commerce`
- Capability: `promotion`
- Table prefix: `commerce_`
- App API prefix: `/app/v3/api/promotions`
- Backend API prefix: `/backend/v3/api/coupons`
- PC application root: `apps/sdkwork-promotion-pc/`

This is a **T1 commerce capability repository**. The `sdkwork-commerce` monolith has been dissolved (see `../sdkwork-specs/MIGRATION_SPEC.md` §8). This repository is self-contained with its own API server, persistence, IAM middleware, and SDK surfaces.

## Verification

```bash
pnpm install
pnpm verify
cargo test --workspace
```

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)
