# Promotion Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-24
Specs: ARCHITECTURE_DECISION_SPEC.md, RUST_CODE_SPEC.md, API_SPEC.md, WEB_FRAMEWORK_SPEC.md, DATABASE_FRAMEWORK_SPEC.md

## 1. Architecture Overview

`sdkwork-promotion` is a **T1 capability repository** in the commerce domain. It owns domain services, SQL repositories, HTTP route builders, and a standalone gateway with IAM middleware. The `sdkwork-commerce` monolith has been dissolved; each T1 capability repository is self-contained.

```text
T1 promotion crate  →  build_*_router()     (no IAM)
T1 standalone-gateway       →  with_request_identity / with_backend_request_identity
```

Migration status: **complete**.

## 2. Technology Choices

- **Rust** domain services and SQLx repositories (`RUST_CODE_SPEC.md`)
- **Axum** HTTP routers integrated via `sdkwork-web-framework` (`WEB_FRAMEWORK_SPEC.md`)
- **sqlx** for Postgres/SQLite repository implementations (`DATABASE_FRAMEWORK_SPEC.md`)
- **Sibling path dependencies** from this repository's `Cargo.toml` — cross-T1 references use `sdkwork_commerce_*` crate names per `sdkwork-<domain>-<capability>-service` naming

## 3. System Boundaries And Modules

| Layer | Owner | Notes |
| --- | --- | --- |
| Domain commands/queries | `sdkwork-commerce-promotion-service` | Business validation and ports |
| SQL repositories | `sdkwork-commerce-promotion-repository-sqlx` | Tenant-scoped persistence |
| HTTP route builders | sdkwork-routes-promotion-app-api, sdkwork-routes-promotion-backend-api | `build_*_router` exports without IAM |
| IAM / gateway composition | `sdkwork-promotion-standalone-gateway` | IAM middleware at T1 standalone-gateway |
| OpenAPI / SDK authority | `sdkwork-promotion/sdks/` | Per-T1 SDK families |

## 4. Directory And Package Layout

Standard capability workspace:

- `crates/sdkwork-commerce-promotion-service/`
- `crates/sdkwork-commerce-promotion-repository-sqlx/`
- `crates/sdkwork-routes-promotion-app-api/`
- `crates/sdkwork-routes-promotion-backend-api/`
- `crates/sdkwork-promotion-database-host/`
- `crates/sdkwork-promotion-service-host/`
- `crates/sdkwork-promotion-standalone-gateway/`
- `packages/common/promotion/` — `@sdkwork/promotion-service`, `@sdkwork/promotion-sdk-ports`, `@sdkwork/promotion-contracts`
- `apps/sdkwork-promotion-pc/` — PC application root (all capability packages migrated: coupon, offer, pricing, points)

## 5. API, SDK, And Data Ownership

- App API prefix: `/app/v3/api/promotions`
- Backend API prefix: `/backend/v3/api/coupons`
- Table prefix: `commerce_` for capability-owned tables (`DOMAIN_SPEC` domain=commerce)
- Public SDK consumption: generated per-T1 SDK families; do not hand-craft raw HTTP (`SDK_SPEC.md`)

## 6. Security, Privacy, And Observability

- Authentication and tenant context are applied at the T1 `*-standalone-gateway` IAM middleware; handlers read `IamAppContext` from extensions.
- Write routes require idempotency and request-hash headers where applicable (`API_SPEC.md`, `SECURITY_SPEC.md`).
- Ledger, payment, and account mutations must fail closed on validation errors.
- Structured errors use `CommerceServiceError` contracts; do not leak internal SQL details to clients.

## 7. Deployment And Runtime Topology

- Local development: `cargo test --workspace` in this repository.
- Independent deployment via `sdkwork-promotion-standalone-gateway`; production gateway routing is owned by deployment/app topology specs.

## 8. Verification

```bash
pnpm install
pnpm verify
cargo test --workspace
```
