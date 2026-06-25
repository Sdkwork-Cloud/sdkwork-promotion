# Repository Guidelines

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root.

## Capability Identity

- Domain: `commerce`
- Capability: `promotion`
- Table prefix: `commerce_`
- App API prefix: `/app/v3/api/coupons`
- Backend API prefix: `/backend/v3/api/coupons`
- PC application root: `apps/sdkwork-promotion-pc/`

Commerce platform consumes this repo via sibling `Cargo.toml [workspace.dependencies]` paths. Do not duplicate these crates under `sdkwork-commerce/crates/`.

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
