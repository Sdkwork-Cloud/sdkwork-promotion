# sdkwork-promotion
repository-kind: application

SDKWork commerce **promotion** capability building-block repository (domain `commerce`).

- Standards: `../sdkwork-specs/README.md`
- Domain service: `crates/sdkwork-commerce-promotion-service/`
- Repository SQL: `crates/sdkwork-commerce-promotion-repository-sqlx/`
- HTTP gateway: `crates/sdkwork-promotion-standalone-gateway/`
- Common packages: `apps/sdkwork-promotion-common/packages/`
- PC app root: `apps/sdkwork-promotion-pc/`

## Quick start

```bash
pnpm install
pnpm verify
cargo test --workspace
```

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## Application Roots

- [apps directory index](apps/README.md)
