# Promotion PRD

Status: active
Owner: SDKWork maintainers
Application: promotion
Updated: 2026-06-24
Specs: REQUIREMENTS_SPEC.md, DOCUMENTATION_SPEC.md

## 1. Background And Problem

Coupons, promotional offers, and points exchange rules require isolated validation and redemption logic.

This repository is a **T1 commerce capability building block**. The `sdkwork-commerce (deleted)` monolith has been dissolved; this repository is self-contained with its own domain logic, persistence, HTTP route builders, API server, and IAM middleware for the **promotion** capability.

## 2. Target Users

Marketing operators, buyers applying coupons, and wallet integrators.

## 3. Goals And Non-Goals

### Goals

- Own promotion/exchange SQL and coupon/points promotion HTTP routers.
- Keep promotion domain commands separate from order pricing orchestration at the T1 standalone-gateway.

### Non-Goals

- Order persistence ownership.

## 4. Scope

- Promotion coupons, codes, discount applications, points balance/history.
- Exchange rule SQL and app HTTP routes (`/wallet/exchange_rate`, `/wallet/points/exchanges/rules`).
- App promotion router including wallet points read surfaces owned by promotion store.

Primary API prefixes:

- App: `/app/v3/api/promotions`
- Backend: `/backend/v3/api/coupons`

Migration status: **complete**.

## 5. User Scenarios

- A buyer lists available coupons and applies one during checkout orchestrated by order capability.
- A wallet integrator reads points-to-cash exchange rate from promotion app router.

## 6. Success Metrics

- Promotion SQL and HTTP routes owned exclusively in sdkwork-promotion.
- Coupon and exchange routes served from `sdkwork-routes-promotion-app-api`.

## 7. Phases

- Phase 1 (complete): domain service, SQL, exchange SQL, and app promotion router owned in sdkwork-promotion.
- Phase 2 (complete): exchange HTTP routes owned by promotion app router (`exchange_router.rs`).

## 8. Linked Requirements

- Commerce repository dissolution: `../sdkwork-specs/MIGRATION_SPEC.md` §8
- Component contract: `specs/component.spec.json` (when present)
- Machine contracts: local `specs/`, future `apis/`, and generated `sdks/`

## 9. Open Questions


