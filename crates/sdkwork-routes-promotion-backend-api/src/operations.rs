use std::sync::Arc;

use axum::extract::{Extension, Path, Query, State};
use axum::response::Response;
use axum::routing::{get, patch};
use axum::{Json, Router};
use sdkwork_commerce_promotion_service::{
    PromotionAdminListQuery, PromotionAdminPage, PromotionAdminService,
    PromotionAdminUserCouponItem, PromotionCampaignInput, PromotionCampaignItem,
    PromotionCodeBatchInput, PromotionCodeBatchItem, PromotionCodeItem, PromotionCouponLedgerItem,
    PromotionCouponStockInput, PromotionCouponStockItem, PromotionDiscountApplicationItem,
    PromotionDistributionInput, PromotionDistributionTaskItem, PromotionOfferInput,
    PromotionOfferItem, PromotionOverview,
};
use sdkwork_contract_service::CommerceServiceError;
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_utils_rust::OffsetListPageParams;
use sdkwork_web_core::WebRequestContext;
use serde::{Deserialize, Serialize};

use crate::api_response::{
    forbidden, internal_error, no_content, not_found, parse_page, success_command, success_created,
    success_item, success_items, unauthorized, validation,
};
use crate::backend_acl::require_backend_operator;

const READ_PERMISSION: &str = "commerce.marketing.read";
const MANAGE_PERMISSION: &str = "commerce.marketing.manage";

#[derive(Clone)]
struct PromotionAdminState {
    service: Arc<PromotionAdminService>,
}

#[derive(Debug, Deserialize)]
struct ListParams {
    page: Option<i64>,
    page_size: Option<i64>,
    q: Option<String>,
    status: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CampaignRequest {
    campaign_code: Option<String>,
    display_name: String,
    description: Option<String>,
    channel_scope: String,
    audience_scope: String,
    starts_at: String,
    ends_at: Option<String>,
    status: String,
    version: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OfferRequest {
    campaign_id: Option<String>,
    offer_code: Option<String>,
    offer_type: String,
    display_name: String,
    description: Option<String>,
    audience_scope: String,
    combinability: String,
    goods_scope: String,
    priority: i32,
    starts_at: String,
    ends_at: Option<String>,
    status: i32,
    discount_type: String,
    discount_value: String,
    minimum_amount: String,
    maximum_discount_amount: Option<String>,
    currency_code: String,
    version: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CouponStockRequest {
    offer_id: String,
    stock_type: String,
    total_quantity: String,
    per_user_limit: i32,
    claim_starts_at: Option<String>,
    claim_ends_at: Option<String>,
    status: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CodeBatchRequest {
    stock_id: String,
    code_type: String,
    quantity: String,
    code_length: i32,
    code_prefix: String,
    starts_at: Option<String>,
    expires_at: Option<String>,
    idempotency_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DistributionRequest {
    stock_id: String,
    owner_user_ids: Vec<String>,
    idempotency_key: String,
}

#[derive(Debug, Deserialize)]
struct UpdateStatusRequest {
    status: i32,
}

macro_rules! response_try {
    ($value:expr) => {
        match $value {
            Ok(value) => value,
            Err(response) => return response,
        }
    };
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OverviewResponse {
    active_offers: i64,
    total_offers: i64,
    total_coupon_stock: i64,
    available_coupons: i64,
    claimed_coupons: i64,
    redeemed_coupons: i64,
    active_codes: i64,
    discount_applications: i64,
}
impl From<PromotionOverview> for OverviewResponse {
    fn from(v: PromotionOverview) -> Self {
        Self {
            active_offers: v.active_offers,
            total_offers: v.total_offers,
            total_coupon_stock: v.total_coupon_stock,
            available_coupons: v.available_coupons,
            claimed_coupons: v.claimed_coupons,
            redeemed_coupons: v.redeemed_coupons,
            active_codes: v.active_codes,
            discount_applications: v.discount_applications,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CampaignResponse {
    id: String,
    campaign_no: String,
    campaign_code: Option<String>,
    display_name: String,
    description: Option<String>,
    channel_scope: String,
    audience_scope: String,
    starts_at: String,
    ends_at: Option<String>,
    status: String,
    version: i64,
    updated_at: String,
}
impl From<PromotionCampaignItem> for CampaignResponse {
    fn from(v: PromotionCampaignItem) -> Self {
        Self {
            id: v.id,
            campaign_no: v.campaign_no,
            campaign_code: v.campaign_code,
            display_name: v.display_name,
            description: v.description,
            channel_scope: v.channel_scope,
            audience_scope: v.audience_scope,
            starts_at: v.starts_at,
            ends_at: v.ends_at,
            status: v.status,
            version: v.version,
            updated_at: v.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OfferResponse {
    id: String,
    campaign_id: Option<String>,
    offer_no: String,
    offer_code: Option<String>,
    offer_type: String,
    display_name: String,
    description: Option<String>,
    priority: i32,
    starts_at: String,
    ends_at: Option<String>,
    status: i32,
    discount_type: Option<String>,
    discount_value: Option<String>,
    minimum_amount: Option<String>,
    maximum_discount_amount: Option<String>,
    currency_code: Option<String>,
    version: i64,
    updated_at: String,
}
impl From<PromotionOfferItem> for OfferResponse {
    fn from(v: PromotionOfferItem) -> Self {
        Self {
            id: v.id,
            campaign_id: v.campaign_id,
            offer_no: v.offer_no,
            offer_code: v.offer_code,
            offer_type: v.offer_type,
            display_name: v.display_name,
            description: v.description,
            priority: v.priority,
            starts_at: v.starts_at,
            ends_at: v.ends_at,
            status: v.status,
            discount_type: v.discount_type,
            discount_value: v.discount_value,
            minimum_amount: v.minimum_amount,
            maximum_discount_amount: v.maximum_discount_amount,
            currency_code: v.currency_code,
            version: v.version,
            updated_at: v.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct StockResponse {
    id: String,
    offer_id: String,
    stock_no: String,
    stock_type: String,
    total_quantity: i64,
    available_quantity: i64,
    claimed_quantity: i64,
    redeemed_quantity: i64,
    locked_quantity: i64,
    per_user_limit: i32,
    claim_starts_at: Option<String>,
    claim_ends_at: Option<String>,
    status: i32,
}
impl From<PromotionCouponStockItem> for StockResponse {
    fn from(v: PromotionCouponStockItem) -> Self {
        Self {
            id: v.id,
            offer_id: v.offer_id,
            stock_no: v.stock_no,
            stock_type: v.stock_type,
            total_quantity: v.total_quantity,
            available_quantity: v.available_quantity,
            claimed_quantity: v.claimed_quantity,
            redeemed_quantity: v.redeemed_quantity,
            locked_quantity: v.locked_quantity,
            per_user_limit: v.per_user_limit,
            claim_starts_at: v.claim_starts_at,
            claim_ends_at: v.claim_ends_at,
            status: v.status,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CodeBatchResponse {
    id: String,
    stock_id: String,
    offer_id: String,
    batch_no: String,
    code_type: String,
    requested_quantity: i64,
    generated_quantity: i64,
    code_length: i32,
    code_prefix: String,
    starts_at: Option<String>,
    expires_at: Option<String>,
    status: String,
    created_at: String,
}
impl From<PromotionCodeBatchItem> for CodeBatchResponse {
    fn from(v: PromotionCodeBatchItem) -> Self {
        Self {
            id: v.id,
            stock_id: v.stock_id,
            offer_id: v.offer_id,
            batch_no: v.batch_no,
            code_type: v.code_type,
            requested_quantity: v.requested_quantity,
            generated_quantity: v.generated_quantity,
            code_length: v.code_length,
            code_prefix: v.code_prefix,
            starts_at: v.starts_at,
            expires_at: v.expires_at,
            status: v.status,
            created_at: v.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CodeResponse {
    id: String,
    stock_id: String,
    offer_id: String,
    code_no: String,
    promotion_code: String,
    code_type: String,
    max_claims: i32,
    claimed_quantity: i32,
    starts_at: Option<String>,
    expires_at: Option<String>,
    status: i32,
}
impl From<PromotionCodeItem> for CodeResponse {
    fn from(v: PromotionCodeItem) -> Self {
        Self {
            id: v.id,
            stock_id: v.stock_id,
            offer_id: v.offer_id,
            code_no: v.code_no,
            promotion_code: v.promotion_code,
            code_type: v.code_type,
            max_claims: v.max_claims,
            claimed_quantity: v.claimed_quantity,
            starts_at: v.starts_at,
            expires_at: v.expires_at,
            status: v.status,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DistributionResponse {
    id: String,
    stock_id: String,
    offer_id: String,
    task_no: String,
    distribution_type: String,
    requested_quantity: i64,
    succeeded_quantity: i64,
    failed_quantity: i64,
    status: String,
    created_at: String,
    completed_at: Option<String>,
}
impl From<PromotionDistributionTaskItem> for DistributionResponse {
    fn from(v: PromotionDistributionTaskItem) -> Self {
        Self {
            id: v.id,
            stock_id: v.stock_id,
            offer_id: v.offer_id,
            task_no: v.task_no,
            distribution_type: v.distribution_type,
            requested_quantity: v.requested_quantity,
            succeeded_quantity: v.succeeded_quantity,
            failed_quantity: v.failed_quantity,
            status: v.status,
            created_at: v.created_at,
            completed_at: v.completed_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UserCouponResponse {
    id: String,
    coupon_no: String,
    stock_id: String,
    offer_id: String,
    owner_user_id: String,
    coupon_code: String,
    status: i32,
    claimed_at: String,
    valid_from: String,
    expires_at: Option<String>,
    redeemed_at: Option<String>,
    source_type: Option<String>,
    source_id: Option<String>,
}
impl From<PromotionAdminUserCouponItem> for UserCouponResponse {
    fn from(v: PromotionAdminUserCouponItem) -> Self {
        Self {
            id: v.id,
            coupon_no: v.coupon_no,
            stock_id: v.stock_id,
            offer_id: v.offer_id,
            owner_user_id: v.owner_user_id,
            coupon_code: v.coupon_code,
            status: v.status,
            claimed_at: v.claimed_at,
            valid_from: v.valid_from,
            expires_at: v.expires_at,
            redeemed_at: v.redeemed_at,
            source_type: v.source_type,
            source_id: v.source_id,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LedgerResponse {
    id: String,
    stock_id: String,
    user_coupon_id: Option<String>,
    offer_id: String,
    subject_id: Option<String>,
    direction: String,
    quantity_delta: i64,
    balance_after: i64,
    business_type: String,
    business_no: String,
    created_at: String,
}
impl From<PromotionCouponLedgerItem> for LedgerResponse {
    fn from(v: PromotionCouponLedgerItem) -> Self {
        Self {
            id: v.id,
            stock_id: v.stock_id,
            user_coupon_id: v.user_coupon_id,
            offer_id: v.offer_id,
            subject_id: v.subject_id,
            direction: v.direction,
            quantity_delta: v.quantity_delta,
            balance_after: v.balance_after,
            business_type: v.business_type,
            business_no: v.business_no,
            created_at: v.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApplicationResponse {
    id: String,
    application_no: String,
    order_id: String,
    order_no: Option<String>,
    offer_id: String,
    discount_type: String,
    discount_amount: String,
    currency_code: String,
    status: i32,
    applied_at: String,
    settled_at: Option<String>,
    released_at: Option<String>,
    rolled_back_at: Option<String>,
}
impl From<PromotionDiscountApplicationItem> for ApplicationResponse {
    fn from(v: PromotionDiscountApplicationItem) -> Self {
        Self {
            id: v.id,
            application_no: v.application_no,
            order_id: v.order_id,
            order_no: v.order_no,
            offer_id: v.offer_id,
            discount_type: v.discount_type,
            discount_amount: v.discount_amount,
            currency_code: v.currency_code,
            status: v.status,
            applied_at: v.applied_at,
            settled_at: v.settled_at,
            released_at: v.released_at,
            rolled_back_at: v.rolled_back_at,
        }
    }
}

pub fn build_backend_promotion_router(service: Arc<PromotionAdminService>) -> Router {
    Router::new()
        .route("/backend/v3/api/promotions/overview", get(get_overview))
        .route(
            "/backend/v3/api/promotions/campaigns",
            get(list_campaigns).post(create_campaign),
        )
        .route(
            "/backend/v3/api/promotions/campaigns/{campaignId}",
            get(retrieve_campaign)
                .patch(update_campaign)
                .delete(delete_campaign),
        )
        .route(
            "/backend/v3/api/promotions/offers",
            get(list_offers).post(create_offer),
        )
        .route(
            "/backend/v3/api/promotions/offers/{offerId}",
            get(retrieve_offer).patch(update_offer).delete(delete_offer),
        )
        .route(
            "/backend/v3/api/promotions/offers/{offerId}/status",
            patch(update_offer_status),
        )
        .route(
            "/backend/v3/api/promotions/coupon_stocks",
            get(list_stocks).post(create_stock),
        )
        .route(
            "/backend/v3/api/promotions/code_batches",
            get(list_code_batches).post(create_code_batch),
        )
        .route("/backend/v3/api/promotions/codes", get(list_codes))
        .route(
            "/backend/v3/api/promotions/distribution_tasks",
            get(list_distributions).post(create_distribution),
        )
        .route(
            "/backend/v3/api/promotions/user_coupons",
            get(list_user_coupons),
        )
        .route(
            "/backend/v3/api/promotions/coupon_ledger_entries",
            get(list_ledger),
        )
        .route(
            "/backend/v3/api/promotions/discount_applications",
            get(list_applications),
        )
        .with_state(PromotionAdminState { service })
}

async fn get_overview(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    match s.service.retrieve_overview(&scope).await {
        Ok(v) => success_item(Some(&c), OverviewResponse::from(v)),
        Err(e) => service_error(Some(&c), "retrieve overview", e),
    }
}

async fn list_campaigns(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_campaigns(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, CampaignResponse::from),
        Err(e) => service_error(Some(&c), "list campaigns", e),
    }
}
async fn retrieve_campaign(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "campaignId"));
    match s.service.retrieve_campaign(&scope, id).await {
        Ok(Some(v)) => success_item(Some(&c), CampaignResponse::from(v)),
        Ok(None) => not_found(Some(&c), "campaign not found"),
        Err(e) => service_error(Some(&c), "retrieve campaign", e),
    }
}
async fn create_campaign(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Json(b): Json<CampaignRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let input = response_try!(campaign_input(b).map_err(|e| validation(Some(&c), e.message())));
    match s.service.create_campaign(&scope, &input).await {
        Ok(v) => success_created(Some(&c), CampaignResponse::from(v)),
        Err(e) => service_error(Some(&c), "create campaign", e),
    }
}
async fn update_campaign(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
    Json(b): Json<CampaignRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "campaignId"));
    let input = response_try!(campaign_input(b).map_err(|e| validation(Some(&c), e.message())));
    match s.service.update_campaign(&scope, id, &input).await {
        Ok(Some(v)) => success_item(Some(&c), CampaignResponse::from(v)),
        Ok(None) => not_found(Some(&c), "campaign not found or version conflict"),
        Err(e) => service_error(Some(&c), "update campaign", e),
    }
}
async fn delete_campaign(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "campaignId"));
    match s.service.delete_campaign(&scope, id).await {
        Ok(true) => no_content(Some(&c)),
        Ok(false) => not_found(Some(&c), "draft campaign not found or already in use"),
        Err(e) => service_error(Some(&c), "delete campaign", e),
    }
}

async fn list_offers(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_offers(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, OfferResponse::from),
        Err(e) => service_error(Some(&c), "list offers", e),
    }
}
async fn retrieve_offer(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "offerId"));
    match s.service.retrieve_offer(&scope, id).await {
        Ok(Some(v)) => success_item(Some(&c), OfferResponse::from(v)),
        Ok(None) => not_found(Some(&c), "offer not found"),
        Err(e) => service_error(Some(&c), "retrieve offer", e),
    }
}
async fn create_offer(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Json(b): Json<OfferRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let input = response_try!(offer_input(b).map_err(|e| validation(Some(&c), e.message())));
    match s.service.create_offer(&scope, &input).await {
        Ok(v) => success_created(Some(&c), OfferResponse::from(v)),
        Err(e) => service_error(Some(&c), "create offer", e),
    }
}
async fn update_offer(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
    Json(b): Json<OfferRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "offerId"));
    let input = response_try!(offer_input(b).map_err(|e| validation(Some(&c), e.message())));
    match s.service.update_offer(&scope, id, &input).await {
        Ok(Some(v)) => success_item(Some(&c), OfferResponse::from(v)),
        Ok(None) => not_found(Some(&c), "offer not found or version conflict"),
        Err(e) => service_error(Some(&c), "update offer", e),
    }
}
async fn update_offer_status(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
    Json(b): Json<UpdateStatusRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let parsed = response_try!(parse_id(Some(&c), &id, "offerId"));
    match s
        .service
        .update_offer_status(&scope, parsed, b.status)
        .await
    {
        Ok(true) => success_command(Some(&c), id, b.status.to_string()),
        Ok(false) => not_found(Some(&c), "offer not found"),
        Err(e) => service_error(Some(&c), "update offer status", e),
    }
}
async fn delete_offer(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Path(id): Path<String>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let id = response_try!(parse_id(Some(&c), &id, "offerId"));
    match s.service.delete_offer(&scope, id).await {
        Ok(true) => no_content(Some(&c)),
        Ok(false) => not_found(Some(&c), "inactive unused offer not found"),
        Err(e) => service_error(Some(&c), "delete offer", e),
    }
}

async fn list_stocks(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_coupon_stocks(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, StockResponse::from),
        Err(e) => service_error(Some(&c), "list stocks", e),
    }
}
async fn create_stock(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Json(b): Json<CouponStockRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let input = PromotionCouponStockInput {
        offer_id: response_try!(
            parse_i64_field(&b.offer_id, "offerId").map_err(|e| validation(Some(&c), e.message()))
        ),
        stock_type: b.stock_type,
        total_quantity: response_try!(parse_i64_field(&b.total_quantity, "totalQuantity")
            .map_err(|e| validation(Some(&c), e.message()))),
        per_user_limit: b.per_user_limit,
        claim_starts_at: b.claim_starts_at,
        claim_ends_at: b.claim_ends_at,
        status: b.status,
    };
    match s.service.create_coupon_stock(&scope, &input).await {
        Ok(v) => success_created(Some(&c), StockResponse::from(v)),
        Err(e) => service_error(Some(&c), "create stock", e),
    }
}
async fn list_code_batches(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_code_batches(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, CodeBatchResponse::from),
        Err(e) => service_error(Some(&c), "list code batches", e),
    }
}
async fn create_code_batch(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Json(b): Json<CodeBatchRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let input =
        PromotionCodeBatchInput {
            stock_id: response_try!(parse_i64_field(&b.stock_id, "stockId")
                .map_err(|e| validation(Some(&c), e.message()))),
            code_type: b.code_type,
            quantity: response_try!(parse_i64_field(&b.quantity, "quantity")
                .map_err(|e| validation(Some(&c), e.message()))),
            code_length: b.code_length,
            code_prefix: b.code_prefix,
            starts_at: b.starts_at,
            expires_at: b.expires_at,
            idempotency_key: b.idempotency_key,
        };
    match s.service.create_code_batch(&scope, &input).await {
        Ok(v) => success_created(Some(&c), CodeBatchResponse::from(v)),
        Err(e) => service_error(Some(&c), "create code batch", e),
    }
}
async fn list_codes(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_codes(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, CodeResponse::from),
        Err(e) => service_error(Some(&c), "list codes", e),
    }
}
async fn list_distributions(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_distribution_tasks(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, DistributionResponse::from),
        Err(e) => service_error(Some(&c), "list distributions", e),
    }
}
async fn create_distribution(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Json(b): Json<DistributionRequest>,
) -> Response {
    let scope = response_try!(manage_scope(&c, i));
    let owner_user_ids = response_try!(b
        .owner_user_ids
        .iter()
        .map(|value| parse_i64_field(value, "ownerUserIds"))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| validation(Some(&c), e.message())));
    let input = PromotionDistributionInput {
        stock_id: response_try!(
            parse_i64_field(&b.stock_id, "stockId").map_err(|e| validation(Some(&c), e.message()))
        ),
        owner_user_ids,
        idempotency_key: b.idempotency_key,
    };
    match s.service.create_distribution_task(&scope, &input).await {
        Ok(v) => success_created(Some(&c), DistributionResponse::from(v)),
        Err(e) => service_error(Some(&c), "create distribution", e),
    }
}
async fn list_user_coupons(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_user_coupons(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, UserCouponResponse::from),
        Err(e) => service_error(Some(&c), "list user coupons", e),
    }
}
async fn list_ledger(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_coupon_ledger(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, LedgerResponse::from),
        Err(e) => service_error(Some(&c), "list coupon ledger", e),
    }
}
async fn list_applications(
    State(s): State<PromotionAdminState>,
    Extension(i): Extension<IamAppContext>,
    Extension(c): Extension<WebRequestContext>,
    Query(q): Query<ListParams>,
) -> Response {
    let scope = response_try!(read_scope(&c, i));
    let (page, q) = response_try!(list_query(Some(&c), &q));
    match s.service.list_discount_applications(&scope, &q).await {
        Ok(v) => page_response(Some(&c), v, page, ApplicationResponse::from),
        Err(e) => service_error(Some(&c), "list applications", e),
    }
}

fn campaign_input(b: CampaignRequest) -> Result<PromotionCampaignInput, CommerceServiceError> {
    Ok(PromotionCampaignInput {
        campaign_code: b.campaign_code,
        display_name: b.display_name,
        description: b.description,
        channel_scope: b.channel_scope,
        audience_scope: b.audience_scope,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        status: b.status,
        version: parse_optional_i64(b.version.as_deref(), "version")?,
    })
}
fn offer_input(b: OfferRequest) -> Result<PromotionOfferInput, CommerceServiceError> {
    Ok(PromotionOfferInput {
        campaign_id: parse_optional_i64(b.campaign_id.as_deref(), "campaignId")?,
        offer_code: b.offer_code,
        offer_type: b.offer_type,
        display_name: b.display_name,
        description: b.description,
        audience_scope: b.audience_scope,
        combinability: b.combinability,
        goods_scope: b.goods_scope,
        priority: b.priority,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        status: b.status,
        discount_type: b.discount_type,
        discount_value: b.discount_value,
        minimum_amount: b.minimum_amount,
        maximum_discount_amount: b.maximum_discount_amount,
        currency_code: b.currency_code,
        version: parse_optional_i64(b.version.as_deref(), "version")?,
    })
}

fn parse_i64_field(value: &str, name: &str) -> Result<i64, CommerceServiceError> {
    value
        .parse::<i64>()
        .ok()
        .filter(|value| *value > 0)
        .ok_or_else(|| {
            CommerceServiceError::validation(format!("{name} must be a positive integer string"))
        })
}

fn parse_optional_i64(
    value: Option<&str>,
    name: &str,
) -> Result<Option<i64>, CommerceServiceError> {
    value.map(|value| parse_i64_field(value, name)).transpose()
}

fn read_scope(
    c: &WebRequestContext,
    i: IamAppContext,
) -> Result<sdkwork_commerce_promotion_service::PromotionAdminScope, Response> {
    require_backend_operator(Some(c), i, READ_PERMISSION).map_err(|r| *r)
}
fn manage_scope(
    c: &WebRequestContext,
    i: IamAppContext,
) -> Result<sdkwork_commerce_promotion_service::PromotionAdminScope, Response> {
    require_backend_operator(Some(c), i, MANAGE_PERMISSION).map_err(|r| *r)
}
fn parse_id(c: Option<&WebRequestContext>, value: &str, name: &str) -> Result<i64, Response> {
    value
        .parse::<i64>()
        .ok()
        .filter(|v| *v > 0)
        .ok_or_else(|| validation(c, format!("{name} must be a positive integer")))
}
fn list_query(
    c: Option<&WebRequestContext>,
    q: &ListParams,
) -> Result<(OffsetListPageParams, PromotionAdminListQuery), Response> {
    let page = parse_page(c, q.page, q.page_size).map_err(|r| *r)?;
    let query = PromotionAdminListQuery::new(page.page, page.page_size, q.q.as_deref(), q.status)
        .map_err(|e| validation(c, e.message()))?;
    Ok((page, query))
}
fn page_response<T, R, F>(
    c: Option<&WebRequestContext>,
    result: PromotionAdminPage<T>,
    page: OffsetListPageParams,
    map: F,
) -> Response
where
    R: Serialize,
    F: FnMut(T) -> R,
{
    success_items(
        c,
        result.items.into_iter().map(map).collect(),
        result.total_items,
        page,
    )
}
fn service_error(
    c: Option<&WebRequestContext>,
    operation: &'static str,
    error: CommerceServiceError,
) -> Response {
    tracing::error!(
        operation,
        error_code = error.code(),
        error = error.message(),
        "promotion backend operation failed"
    );
    match error.code() {
        "validation" => validation(c, error.message()),
        "not-found" => not_found(c, "promotion resource not found"),
        "unauthenticated" => unauthorized(c, "authentication is required"),
        "unauthorized" => forbidden(c, "permission is required"),
        _ => internal_error(c, "promotion data operation failed"),
    }
}
