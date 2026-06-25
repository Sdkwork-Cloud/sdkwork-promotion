# Promotion Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-24
Specs: ARCHITECTURE_DECISION_SPEC.md, RUST_CODE_SPEC.md, API_SPEC.md, WEB_FRAMEWORK_SPEC.md, DATABASE_FRAMEWORK_SPEC.md

## Document Map

- [Commerce PC capability distribution](../sdkwork-commerce/docs/architecture/tech/TECH-2026-06-24-commerce-pc-capability-distribution.md)
- [Commerce repository dissolution](../sdkwork-commerce/docs/architecture/tech/TECH-2026-06-24-commerce-repository-dissolution.md)

## 1. Architecture Overview

`sdkwork-promotion` is a **T1 capability repository** in the commerce domain. It exposes domain services, SQL repositories, and HTTP route builders. `sdkwork-commerce` composes these crates at runtime:

```text
T1 promotion crate  →  build_*_router()     (no IAM)
T0 commerce         →  with_request_identity / with_backend_request_identity
```

Migration status: **complete**.

## 2. Technology Choices

- **Rust** domain services and SQLx repositories (`RUST_CODE_SPEC.md`)
- **Axum** HTTP routers integrated via `sdkwork-web-framework` (`WEB_FRAMEWORK_SPEC.md`)
- **sqlx** for Postgres/SQLite repository implementations (`DATABASE_FRAMEWORK_SPEC.md`)
- **Sibling path dependencies** from `sdkwork-commerce/Cargo.toml` — no duplicated domain crates in commerce

## 3. System Boundaries And Modules

| Layer | Owner | Notes |
| --- | --- | --- |
| Domain commands/queries | `sdkwork-commerce-promotion-service` | Business validation and ports |
| SQL repositories | `sdkwork-commerce-promotion-repository-sqlx` | Tenant-scoped persistence |
| HTTP route builders | sdkwork-router-promotion-app-api, sdkwork-router-promotion-backend-api | `build_*_router` exports without IAM |
| IAM / gateway composition | `sdkwork-commerce` | Thin wrappers only |
| OpenAPI / SDK authority | `sdkwork-commerce/sdks/` | Composed commerce SDK families |

## 4. Directory And Package Layout

Standard capability workspace:

- `crates/sdkwork-commerce-promotion-service/`
- `crates/sdkwork-commerce-promotion-repository-sqlx/`
- `crates/sdkwork-router-promotion-app-api/`
- `crates/sdkwork-router-promotion-backend-api/`
- `crates/sdkwork-promotion-database-host/`
- `crates/sdkwork-promotion-service-host/`
- `crates/sdkwork-promotion-api-server/`
- `packages/common/promotion/` — `@sdkwork/promotion-service`, `@sdkwork/promotion-sdk-ports`, `@sdkwork/promotion-contracts`
- `apps/sdkwork-promotion-pc/` — PC application root (`sdkwork-promotion-pc-coupon` migrated; offer/pricing/points pending)

## 5. API, SDK, And Data Ownership

- App API prefix: `/app/v3/api/promotions`
- Backend API prefix: `/backend/v3/api/coupons`
- Table prefix: `commerce_` for capability-owned tables (`DOMAIN_SPEC` domain=commerce)
- Public SDK consumption: generated **commerce** SDK families at T0; do not hand-craft raw HTTP (`SDK_SPEC.md`)

## 6. Security, Privacy, And Observability

- Authentication and tenant context are applied at **commerce T0** IAM middleware; handlers read `IamAppContext` from extensions.
- Write routes require idempotency and request-hash headers where applicable (`API_SPEC.md`, `SECURITY_SPEC.md`).
- Ledger, payment, and account mutations must fail closed on validation errors.
- Structured errors use `CommerceServiceError` contracts; do not leak internal SQL details to clients.

## 7. Deployment And Runtime Topology

- Local development: `cargo test --workspace` in this repository.
- Platform composition: `sdkwork-commerce` service host merges capability routers into the commerce HTTP surface.
- Independent deployment of this capability server is supported via `sdkwork-promotion-api-server` for building-block topology; production gateway routing is owned by commerce/app topology specs.

## 8. Architecture Decision Index

- [TECH-2026-06-24-commerce-pc-capability-distribution.md](../sdkwork-commerce/docs/architecture/tech/TECH-2026-06-24-commerce-pc-capability-distribution.md)
- [TECH-2026-06-24-commerce-repository-dissolution.md](../sdkwork-commerce/docs/architecture/tech/TECH-2026-06-24-commerce-repository-dissolution.md)

## 9. Verification

```bash
pnpm install
pnpm verify
cargo test --workspace
```
