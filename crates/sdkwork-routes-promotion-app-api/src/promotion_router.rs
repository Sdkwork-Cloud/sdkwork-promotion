use axum::extract::{Extension, Query, State};
use axum::http::HeaderMap;
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use sdkwork_contract_service::CommerceServiceError;
use sdkwork_promotion_service::{
    ApplyPromotionDiscountCommand, ClaimPromotionUserCouponCommand, PointsBalance,
    PointsBalanceQuery, PointsHistoryItem, PointsHistoryQuery, PromotionCodeRedemptionCommand,
    PromotionCodeRedemptionOutcome, PromotionUserCouponItem, PromotionUserCouponListQuery,
    ReversePromotionDiscountCommand,
};
use sdkwork_promotion_repository_sqlx::{
    PostgresCommerceExchangeStore, PostgresCommercePromotionStore, SqliteCommerceExchangeStore,
    SqliteCommercePromotionStore,
};
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_web_core::WebRequestContext;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, SqlitePool};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::command_headers::validate_app_write_payload;
use crate::subject::{app_runtime_subject_from_extension, AppRuntimeSubject};

const MAX_PROMOTION_CODE_LEN: usize = 128;

pub type CommercePromotionFuture<'a, T> =
    Pin<Box<dyn Future<Output = Result<T, CommerceServiceError>> + Send + 'a>>;

pub trait CommercePromotionStore: Send + Sync {
    fn list_promotion_user_coupons<'a>(
        &'a self,
        query: PromotionUserCouponListQuery,
    ) -> CommercePromotionFuture<'a, Vec<PromotionUserCouponItem>>;

    fn retrieve_points_balance<'a>(
        &'a self,
        query: PointsBalanceQuery,
    ) -> CommercePromotionFuture<'a, PointsBalance>;

    fn list_points_history<'a>(
        &'a self,
        query: PointsHistoryQuery,
    ) -> CommercePromotionFuture<'a, Vec<PointsHistoryItem>>;

    fn redeem_promotion_code<'a>(
        &'a self,
        command: PromotionCodeRedemptionCommand,
    ) -> CommercePromotionFuture<'a, PromotionCodeRedemptionOutcome>;

    fn claim_promotion_user_coupon<'a>(
        &'a self,
        command: ClaimPromotionUserCouponCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem>;

    fn apply_promotion_discount<'a>(
        &'a self,
        command: ApplyPromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem>;

    fn reverse_promotion_discount<'a>(
        &'a self,
        command: ReversePromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem>;
}

#[derive(Clone)]
struct AppPromotionState {
    store: Arc<dyn CommercePromotionStore>,
}

#[derive(Debug, Deserialize)]
struct CouponListQueryParams {
    status: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PromotionCodeRedemptionRequest {
    code: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ClaimPromotionUserCouponRequest {
    offer_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApplyPromotionDiscountRequest {
    order_id: String,
    user_coupon_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ReversePromotionDiscountRequest {
    user_coupon_id: String,
    reason: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PromotionUserCouponItemResponse {
    id: String,
    code: String,
    amount: String,
    date: String,
    status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PointsBalanceResponse {
    available_points: i64,
    frozen_points: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PointsHistoryItemResponse {
    id: String,
    amount: i64,
    direction: String,
    balance_after: i64,
    business_type: String,
    created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PromotionCodeRedemptionOutcomeResponse {
    message: String,
    amount: String,
    credited_points: i64,
    balance: i64,
}

impl CommercePromotionStore for SqliteCommercePromotionStore {
    fn list_promotion_user_coupons<'a>(
        &'a self,
        query: PromotionUserCouponListQuery,
    ) -> CommercePromotionFuture<'a, Vec<PromotionUserCouponItem>> {
        Box::pin(async move { self.list_promotion_user_coupons(query).await })
    }

    fn retrieve_points_balance<'a>(
        &'a self,
        query: PointsBalanceQuery,
    ) -> CommercePromotionFuture<'a, PointsBalance> {
        Box::pin(async move { self.retrieve_points_balance(query).await })
    }

    fn list_points_history<'a>(
        &'a self,
        query: PointsHistoryQuery,
    ) -> CommercePromotionFuture<'a, Vec<PointsHistoryItem>> {
        Box::pin(async move { self.list_points_history(query).await })
    }

    fn redeem_promotion_code<'a>(
        &'a self,
        command: PromotionCodeRedemptionCommand,
    ) -> CommercePromotionFuture<'a, PromotionCodeRedemptionOutcome> {
        Box::pin(async move { self.redeem_promotion_code(command).await })
    }

    fn claim_promotion_user_coupon<'a>(
        &'a self,
        command: ClaimPromotionUserCouponCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.claim_promotion_user_coupon(command).await })
    }

    fn apply_promotion_discount<'a>(
        &'a self,
        command: ApplyPromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.apply_promotion_discount(command).await })
    }

    fn reverse_promotion_discount<'a>(
        &'a self,
        command: ReversePromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.reverse_promotion_discount(command).await })
    }
}

impl CommercePromotionStore for PostgresCommercePromotionStore {
    fn list_promotion_user_coupons<'a>(
        &'a self,
        query: PromotionUserCouponListQuery,
    ) -> CommercePromotionFuture<'a, Vec<PromotionUserCouponItem>> {
        Box::pin(async move { self.list_promotion_user_coupons(query).await })
    }

    fn retrieve_points_balance<'a>(
        &'a self,
        query: PointsBalanceQuery,
    ) -> CommercePromotionFuture<'a, PointsBalance> {
        Box::pin(async move { self.retrieve_points_balance(query).await })
    }

    fn list_points_history<'a>(
        &'a self,
        query: PointsHistoryQuery,
    ) -> CommercePromotionFuture<'a, Vec<PointsHistoryItem>> {
        Box::pin(async move { self.list_points_history(query).await })
    }

    fn redeem_promotion_code<'a>(
        &'a self,
        command: PromotionCodeRedemptionCommand,
    ) -> CommercePromotionFuture<'a, PromotionCodeRedemptionOutcome> {
        Box::pin(async move { self.redeem_promotion_code(command).await })
    }

    fn claim_promotion_user_coupon<'a>(
        &'a self,
        command: ClaimPromotionUserCouponCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.claim_promotion_user_coupon(command).await })
    }

    fn apply_promotion_discount<'a>(
        &'a self,
        command: ApplyPromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.apply_promotion_discount(command).await })
    }

    fn reverse_promotion_discount<'a>(
        &'a self,
        command: ReversePromotionDiscountCommand,
    ) -> CommercePromotionFuture<'a, PromotionUserCouponItem> {
        Box::pin(async move { self.reverse_promotion_discount(command).await })
    }
}

pub fn app_promotion_router_with_sqlite_pool(pool: SqlitePool) -> Router {
    build_app_promotion_router(Arc::new(SqliteCommercePromotionStore::new(pool.clone())))
        .merge(crate::exchange_router::build_app_exchange_router(Arc::new(
            SqliteCommerceExchangeStore::new(pool),
        )))
}

pub fn app_promotion_router_with_postgres_pool(pool: PgPool) -> Router {
    build_app_promotion_router(Arc::new(PostgresCommercePromotionStore::new(pool.clone())))
        .merge(crate::exchange_router::build_app_exchange_router(Arc::new(
            PostgresCommerceExchangeStore::new(pool),
        )))
}

pub fn build_app_promotion_router(store: Arc<dyn CommercePromotionStore>) -> Router {
    Router::new()
            .route(
                "/app/v3/api/promotions/user_coupons",
                get(fetch_promotion_user_coupons),
            )
            .route(
                "/app/v3/api/promotions/user_coupons/{userCouponId}",
                get(retrieve_promotion_user_coupon),
            )
            .route(
                "/app/v3/api/promotions/user_coupons/wallet",
                get(fetch_promotion_user_coupon_wallet),
            )
            .route(
                "/app/v3/api/promotions/user_coupons/wallet/{userCouponId}",
                get(retrieve_promotion_user_coupon_wallet_item),
            )
            .route(
                "/app/v3/api/promotions/offers",
                get(fetch_promotion_offers),
            )
            .route(
                "/app/v3/api/promotions/offers/{offerId}",
                get(retrieve_promotion_offer),
            )
            .route("/app/v3/api/wallet/points", get(fetch_points_balance))
            .route(
                "/app/v3/api/wallet/points/history",
                get(fetch_points_history),
            )
            .route(
                "/app/v3/api/promotions/user_coupon_claims",
                post(claim_promotion_user_coupon),
            )
            .route(
                "/app/v3/api/promotions/codes/redemptions",
                post(redeem_promotion_code),
            )
            .route(
                "/app/v3/api/promotions/discount_applications",
                post(apply_promotion_discount),
            )
            .route(
                "/app/v3/api/promotions/discount_applications/{applicationId}/releases",
                post(release_promotion_discount),
            )
            .route(
                "/app/v3/api/promotions/discount_applications/{applicationId}/rollback",
                post(rollback_promotion_discount),
            )
            .route(
                "/app/v3/api/promotions/discount_applications/{applicationId}/settlements",
                post(settle_promotion_discount),
            )
            .route(
                "/app/v3/api/promotions/discount_applications/reversals",
                post(reverse_promotion_discount),
            )
            .with_state(AppPromotionState { store })
}

async fn fetch_promotion_user_coupons(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    Query(query): Query<CouponListQueryParams>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let query = match PromotionUserCouponListQuery::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
        query.status.as_deref(),
    ) {
        Ok(query) => query,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.list_promotion_user_coupons(query).await {
        Ok(items) => crate::api_response::success_items(
            ctx,
            items
                .into_iter()
                .map(map_promotion_user_coupon)
                .collect::<Vec<_>>(),
            1,
            20,
        ),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn fetch_points_balance(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let query = match PointsBalanceQuery::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
    ) {
        Ok(query) => query,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.retrieve_points_balance(query).await {
        Ok(balance) => crate::api_response::success_item(ctx, map_points_balance(balance)),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn fetch_points_history(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let query = match PointsHistoryQuery::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
    ) {
        Ok(query) => query,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.list_points_history(query).await {
        Ok(items) => crate::api_response::success_items(
            ctx,
            items
                .into_iter()
                .map(map_points_history)
                .collect::<Vec<_>>(),
            1,
            20,
        ),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn claim_promotion_user_coupon(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    headers: HeaderMap,
    body: Json<ClaimPromotionUserCouponRequest>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let write_headers = match validate_app_write_payload(
        &headers,
        "promotions.userCoupons.claim",
        &*body,
        |idempotency_key| fallback_request_no(&subject, &body.offer_id, idempotency_key),
    ) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let command = match ClaimPromotionUserCouponCommand::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
        &body.offer_id,
        &write_headers.request_no,
        &write_headers.idempotency_key,
    ) {
        Ok(command) => command,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.claim_promotion_user_coupon(command).await {
        Ok(item) => crate::api_response::success_item(ctx, map_promotion_user_coupon(item)),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn apply_promotion_discount(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    headers: HeaderMap,
    body: Json<ApplyPromotionDiscountRequest>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let write_headers = match validate_app_write_payload(
        &headers,
        "promotions.discounts.apply",
        &*body,
        |idempotency_key| {
            fallback_request_no(
                &subject,
                &format!("{}-{}", body.order_id, body.user_coupon_id),
                idempotency_key,
            )
        },
    ) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let command = match ApplyPromotionDiscountCommand::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
        &body.order_id,
        &body.user_coupon_id,
        &write_headers.request_no,
        &write_headers.idempotency_key,
    ) {
        Ok(command) => command,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.apply_promotion_discount(command).await {
        Ok(item) => crate::api_response::success_item(ctx, map_promotion_user_coupon(item)),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn reverse_promotion_discount(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    headers: HeaderMap,
    body: Json<ReversePromotionDiscountRequest>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let write_headers = match validate_app_write_payload(
        &headers,
        "promotions.discounts.reverse",
        &*body,
        |idempotency_key| fallback_request_no(&subject, &body.user_coupon_id, idempotency_key),
    ) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let command = match ReversePromotionDiscountCommand::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
        &body.user_coupon_id,
        &write_headers.request_no,
        &write_headers.idempotency_key,
        body.reason.as_deref(),
    ) {
        Ok(command) => command,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.reverse_promotion_discount(command).await {
        Ok(item) => crate::api_response::success_item(ctx, map_promotion_user_coupon(item)),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn redeem_promotion_code(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    headers: HeaderMap,
    Json(request): Json<PromotionCodeRedemptionRequest>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let write_headers = match validate_app_write_payload(
        &headers,
        "promotions.codes.redeem",
        &request,
        |idempotency_key| {
            fallback_request_no(
                &subject,
                request.code.as_deref().unwrap_or_default(),
                idempotency_key,
            )
        },
    ) {
        Ok(value) => value,
        Err(response) => return response,
    };
    let code = match validate_promotion_code_redemption_request(request) {
        Ok(code) => code,
        Err(message) => return crate::api_response::validation(ctx, message),
    };
    let command = match PromotionCodeRedemptionCommand::new(
        &subject.tenant_id,
        subject.organization_id.as_deref(),
        &subject.user_id,
        &code,
        &write_headers.request_no,
        &write_headers.idempotency_key,
    ) {
        Ok(command) => command,
        Err(error) => return crate::api_response::map_service_error(ctx, error),
    };

    match state.store.redeem_promotion_code(command).await {
        Ok(outcome) => crate::api_response::success_item(
            ctx,
            map_promotion_code_redemption_outcome(outcome),
        ),
        Err(error) => crate::api_response::map_service_error(ctx, error),
    }
}

async fn fetch_promotion_offers(
    State(_state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    crate::api_response::success_items(ctx, Vec::<serde_json::Value>::new(), 1, 20)
}

async fn retrieve_promotion_offer(
    State(_state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(offer_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = offer_id;
    crate::api_response::not_found(ctx, "promotion offer not found")
}

async fn retrieve_promotion_user_coupon(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(user_coupon_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = (subject, user_coupon_id, state);
    crate::api_response::not_found(ctx, "promotion user coupon not found")
}

async fn fetch_promotion_user_coupon_wallet(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = state;
    crate::api_response::success_items(ctx, Vec::<serde_json::Value>::new(), 1, 20)
}

async fn retrieve_promotion_user_coupon_wallet_item(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(user_coupon_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = (state, user_coupon_id);
    crate::api_response::not_found(ctx, "promotion wallet coupon not found")
}

async fn release_promotion_discount(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(application_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = (state, application_id);
    crate::api_response::not_found(ctx, "discount application not found")
}

async fn rollback_promotion_discount(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(application_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = (state, application_id);
    crate::api_response::not_found(ctx, "discount application not found")
}

async fn settle_promotion_discount(
    State(state): State<AppPromotionState>,
    runtime_context: Option<Extension<IamAppContext>>,
    request_context: Option<Extension<WebRequestContext>>,
    axum::extract::Path(application_id): axum::extract::Path<String>,
) -> Response {
    let ctx = request_context.as_ref().map(|ext| &ext.0);
    let _subject = match app_runtime_subject_from_extension(runtime_context) {
        Ok(subject) => subject,
        Err(message) => return crate::api_response::unauthorized(ctx, message),
    };
    let _ = (state, application_id);
    crate::api_response::not_found(ctx, "discount application not found")
}

fn validate_promotion_code_redemption_request(
    request: PromotionCodeRedemptionRequest,
) -> Result<String, String> {
    let code = request.code.unwrap_or_default().trim().to_owned();
    if code.is_empty() {
        return Err("promotion code must not be empty".to_owned());
    }
    if code.chars().count() > MAX_PROMOTION_CODE_LEN {
        return Err(format!(
            "promotion code length must not exceed {MAX_PROMOTION_CODE_LEN} characters"
        ));
    }
    if !code.bytes().all(|byte| (0x21..=0x7e).contains(&byte)) {
        return Err("promotion code must contain only visible ASCII characters".to_owned());
    }
    Ok(code)
}

fn map_promotion_user_coupon(value: PromotionUserCouponItem) -> PromotionUserCouponItemResponse {
    PromotionUserCouponItemResponse {
        id: value.id,
        code: value.code,
        amount: value.amount.as_str().to_owned(),
        date: value.date,
        status: value.status,
    }
}

fn map_points_balance(value: PointsBalance) -> PointsBalanceResponse {
    PointsBalanceResponse {
        available_points: value.available_points,
        frozen_points: value.frozen_points,
    }
}

fn map_points_history(value: PointsHistoryItem) -> PointsHistoryItemResponse {
    PointsHistoryItemResponse {
        id: value.id,
        amount: value.amount,
        direction: value.direction,
        balance_after: value.balance_after,
        business_type: value.business_type,
        created_at: value.created_at,
    }
}

fn map_promotion_code_redemption_outcome(
    value: PromotionCodeRedemptionOutcome,
) -> PromotionCodeRedemptionOutcomeResponse {
    PromotionCodeRedemptionOutcomeResponse {
        message: value.message,
        amount: value.amount.as_str().to_owned(),
        credited_points: value.credited_points,
        balance: value.balance,
    }
}

fn fallback_request_no(subject: &AppRuntimeSubject, code: &str, idempotency_key: &str) -> String {
    let code_part = code
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.') {
                character
            } else {
                '-'
            }
        })
        .collect::<String>();
    format!(
        "promotion-code-redemption-{}-{}-{}",
        subject.user_id,
        code_part,
        stable_header_token(idempotency_key),
    )
}

fn stable_header_token(value: &str) -> String {
    value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.') {
                character
            } else {
                '-'
            }
        })
        .collect()
}
