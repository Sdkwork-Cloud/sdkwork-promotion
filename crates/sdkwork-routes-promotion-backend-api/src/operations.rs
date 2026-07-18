use axum::extract::{Extension, Path, Query, State};
use axum::response::Response;
use axum::routing::{get, patch};
use axum::{Json, Router};
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_utils_rust::OffsetListPageParams;
use sdkwork_web_core::WebRequestContext;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgRow;
use sqlx::sqlite::SqliteRow;
use sqlx::{PgPool, Row, SqlitePool};

use crate::api_response::{
    internal_error, not_found, parse_page, success_command, success_item, success_items, validation,
};
use crate::backend_acl::require_backend_operator;
use crate::subject::BackendOperatorScope;

const READ_PERMISSION: &str = "commerce.marketing.read";
const MANAGE_PERMISSION: &str = "commerce.marketing.manage";

#[derive(Clone)]
enum PromotionPool {
    Postgres(PgPool),
    Sqlite(SqlitePool),
}

enum PromotionRow {
    Postgres(PgRow),
    Sqlite(SqliteRow),
}

impl PromotionRow {
    fn i32(&self, name: &str) -> i32 {
        match self {
            Self::Postgres(row) => row.get(name),
            Self::Sqlite(row) => row.get(name),
        }
    }

    fn i64(&self, name: &str) -> i64 {
        match self {
            Self::Postgres(row) => row.get(name),
            Self::Sqlite(row) => row.get(name),
        }
    }

    fn string(&self, name: &str) -> String {
        match self {
            Self::Postgres(row) => row.get(name),
            Self::Sqlite(row) => row.get(name),
        }
    }

    fn optional_string(&self, name: &str) -> Option<String> {
        match self {
            Self::Postgres(row) => row.get(name),
            Self::Sqlite(row) => row.get(name),
        }
    }
}

#[derive(Clone)]
struct PromotionAdminState {
    pool: PromotionPool,
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
struct UpdateStatusRequest {
    status: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PromotionOverview {
    active_offers: i64,
    total_offers: i64,
    total_coupon_stock: i64,
    available_coupons: i64,
    claimed_coupons: i64,
    redeemed_coupons: i64,
    active_codes: i64,
    discount_applications: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OfferItem {
    id: String,
    offer_no: String,
    offer_code: Option<String>,
    offer_type: String,
    display_name: String,
    description: Option<String>,
    priority: i32,
    starts_at: String,
    ends_at: Option<String>,
    status: i32,
    updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CouponStockItem {
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PromotionCodeItem {
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DiscountApplicationItem {
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

pub(crate) fn backend_promotion_router_with_postgres_pool(pool: PgPool) -> Router {
    build_router(PromotionPool::Postgres(pool))
}

pub(crate) fn backend_promotion_router_with_sqlite_pool(pool: SqlitePool) -> Router {
    build_router(PromotionPool::Sqlite(pool))
}

fn build_router(pool: PromotionPool) -> Router {
    Router::new()
        .route("/backend/v3/api/promotions/overview", get(get_overview))
        .route("/backend/v3/api/promotions/offers", get(list_offers))
        .route(
            "/backend/v3/api/promotions/offers/{offerId}/status",
            patch(update_offer_status),
        )
        .route(
            "/backend/v3/api/promotions/coupon_stocks",
            get(list_coupon_stocks),
        )
        .route("/backend/v3/api/promotions/codes", get(list_codes))
        .route(
            "/backend/v3/api/promotions/discount_applications",
            get(list_discount_applications),
        )
        .with_state(PromotionAdminState { pool })
}

async fn get_overview(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, READ_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    match load_overview(&state.pool, &scope).await {
        Ok(item) => success_item(context, item),
        Err(error) => internal_error(
            context,
            format!("unable to load promotion overview: {error}"),
        ),
    }
}

async fn list_offers(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
    Query(query): Query<ListParams>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, READ_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    let page = match parse_page(context, query.page, query.page_size) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    match load_offers(&state.pool, &scope, &query, page).await {
        Ok((items, total)) => success_items(context, items, total, page),
        Err(error) => internal_error(context, format!("unable to list promotion offers: {error}")),
    }
}

async fn update_offer_status(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
    Path(offer_id): Path<String>,
    Json(body): Json<UpdateStatusRequest>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, MANAGE_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    if !matches!(body.status, 0 | 1) {
        return validation(context, "offer status must be 0 or 1");
    }
    let id = match offer_id.parse::<i64>() {
        Ok(value) => value,
        Err(_) => return validation(context, "offerId must be numeric"),
    };
    match set_offer_status(&state.pool, &scope, id, body.status).await {
        Ok(true) => success_command(context, offer_id, body.status.to_string()),
        Ok(false) => not_found(context, "promotion offer not found"),
        Err(error) => internal_error(
            context,
            format!("unable to update promotion offer: {error}"),
        ),
    }
}

async fn list_coupon_stocks(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
    Query(query): Query<ListParams>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, READ_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    let page = match parse_page(context, query.page, query.page_size) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    match load_coupon_stocks(&state.pool, &scope, &query, page).await {
        Ok((items, total)) => success_items(context, items, total, page),
        Err(error) => internal_error(context, format!("unable to list coupon stock: {error}")),
    }
}

async fn list_codes(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
    Query(query): Query<ListParams>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, READ_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    let page = match parse_page(context, query.page, query.page_size) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    match load_codes(&state.pool, &scope, &query, page).await {
        Ok((items, total)) => success_items(context, items, total, page),
        Err(error) => internal_error(context, format!("unable to list promotion codes: {error}")),
    }
}

async fn list_discount_applications(
    State(state): State<PromotionAdminState>,
    Extension(iam): Extension<IamAppContext>,
    Extension(request_context): Extension<WebRequestContext>,
    Query(query): Query<ListParams>,
) -> Response {
    let context = Some(&request_context);
    let scope = match require_backend_operator(context, iam, READ_PERMISSION) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    let page = match parse_page(context, query.page, query.page_size) {
        Ok(value) => value,
        Err(response) => return *response,
    };
    match load_discount_applications(&state.pool, &scope, &query, page).await {
        Ok((items, total)) => success_items(context, items, total, page),
        Err(error) => internal_error(
            context,
            format!("unable to list discount applications: {error}"),
        ),
    }
}

fn offset(page: OffsetListPageParams) -> i64 {
    (page.page - 1) * page.page_size
}

fn normalized_search(query: &ListParams) -> String {
    format!(
        "%{}%",
        query.q.as_deref().unwrap_or_default().trim().to_lowercase()
    )
}

async fn load_overview(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
) -> Result<PromotionOverview, sqlx::Error> {
    let sql = "SELECT COUNT(*) AS total_offers, COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0) AS active_offers, COALESCE((SELECT SUM(total_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0) AS total_coupon_stock, COALESCE((SELECT SUM(available_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0) AS available_coupons, COALESCE((SELECT SUM(claimed_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0) AS claimed_coupons, COALESCE((SELECT SUM(redeemed_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0) AS redeemed_coupons, COALESCE((SELECT COUNT(*) FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND status = 1), 0) AS active_codes, COALESCE((SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2), 0) AS discount_applications FROM promotion_offer WHERE tenant_id = $1 AND organization_id = $2";
    let sqlite_sql = sql.replace("$1", "?1").replace("$2", "?2");
    let row = match pool {
        PromotionPool::Postgres(pool) => PromotionRow::Postgres(
            sqlx::query(sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_one(pool)
                .await?,
        ),
        PromotionPool::Sqlite(pool) => PromotionRow::Sqlite(
            sqlx::query(&sqlite_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_one(pool)
                .await?,
        ),
    };
    Ok(PromotionOverview {
        total_offers: row.i64("total_offers"),
        active_offers: row.i64("active_offers"),
        total_coupon_stock: row.i64("total_coupon_stock"),
        available_coupons: row.i64("available_coupons"),
        claimed_coupons: row.i64("claimed_coupons"),
        redeemed_coupons: row.i64("redeemed_coupons"),
        active_codes: row.i64("active_codes"),
        discount_applications: row.i64("discount_applications"),
    })
}

async fn load_offers(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    query: &ListParams,
    page: OffsetListPageParams,
) -> Result<(Vec<OfferItem>, i64), sqlx::Error> {
    let search = normalized_search(query);
    let count_sql = "SELECT COUNT(*) FROM promotion_offer WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(display_name) LIKE $3 OR LOWER(COALESCE(offer_code, '')) LIKE $3) AND ($4 IS NULL OR status = $4)";
    let list_sql = "SELECT id, offer_no, offer_code, offer_type, display_name, description, priority, CAST(starts_at AS TEXT) AS starts_at, CAST(ends_at AS TEXT) AS ends_at, status, CAST(updated_at AS TEXT) AS updated_at FROM promotion_offer WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(display_name) LIKE $3 OR LOWER(COALESCE(offer_code, '')) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY priority DESC, starts_at DESC LIMIT $5 OFFSET $6";
    let (count_row, rows) = query_rows(
        pool,
        scope,
        query.status,
        &search,
        count_sql,
        list_sql,
        page,
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| OfferItem {
            id: row.i64("id").to_string(),
            offer_no: row.string("offer_no"),
            offer_code: row.optional_string("offer_code"),
            offer_type: row.string("offer_type"),
            display_name: row.string("display_name"),
            description: row.optional_string("description"),
            priority: row.i32("priority"),
            starts_at: row.string("starts_at"),
            ends_at: row.optional_string("ends_at"),
            status: row.i32("status"),
            updated_at: row.string("updated_at"),
        })
        .collect();
    Ok((items, count_row))
}

async fn load_coupon_stocks(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    query: &ListParams,
    page: OffsetListPageParams,
) -> Result<(Vec<CouponStockItem>, i64), sqlx::Error> {
    let search = normalized_search(query);
    let count_sql = "SELECT COUNT(*) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(stock_no) LIKE $3) AND ($4 IS NULL OR status = $4)";
    let list_sql = "SELECT id, offer_id, stock_no, stock_type, total_quantity, available_quantity, claimed_quantity, redeemed_quantity, locked_quantity, per_user_limit, CAST(claim_starts_at AS TEXT) AS claim_starts_at, CAST(claim_ends_at AS TEXT) AS claim_ends_at, status FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(stock_no) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY created_at DESC LIMIT $5 OFFSET $6";
    let (count, rows) = query_rows(
        pool,
        scope,
        query.status,
        &search,
        count_sql,
        list_sql,
        page,
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| CouponStockItem {
            id: row.i64("id").to_string(),
            offer_id: row.i64("offer_id").to_string(),
            stock_no: row.string("stock_no"),
            stock_type: row.string("stock_type"),
            total_quantity: row.i64("total_quantity"),
            available_quantity: row.i64("available_quantity"),
            claimed_quantity: row.i64("claimed_quantity"),
            redeemed_quantity: row.i64("redeemed_quantity"),
            locked_quantity: row.i64("locked_quantity"),
            per_user_limit: row.i32("per_user_limit"),
            claim_starts_at: row.optional_string("claim_starts_at"),
            claim_ends_at: row.optional_string("claim_ends_at"),
            status: row.i32("status"),
        })
        .collect();
    Ok((items, count))
}

async fn load_codes(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    query: &ListParams,
    page: OffsetListPageParams,
) -> Result<(Vec<PromotionCodeItem>, i64), sqlx::Error> {
    let search = normalized_search(query);
    let count_sql = "SELECT COUNT(*) FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(promotion_code) LIKE $3 OR LOWER(code_no) LIKE $3) AND ($4 IS NULL OR status = $4)";
    let list_sql = "SELECT id, stock_id, offer_id, code_no, promotion_code, code_type, max_claims, claimed_quantity, CAST(starts_at AS TEXT) AS starts_at, CAST(expires_at AS TEXT) AS expires_at, status FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(promotion_code) LIKE $3 OR LOWER(code_no) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY created_at DESC LIMIT $5 OFFSET $6";
    let (count, rows) = query_rows(
        pool,
        scope,
        query.status,
        &search,
        count_sql,
        list_sql,
        page,
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| PromotionCodeItem {
            id: row.i64("id").to_string(),
            stock_id: row.i64("stock_id").to_string(),
            offer_id: row.i64("offer_id").to_string(),
            code_no: row.string("code_no"),
            promotion_code: row.string("promotion_code"),
            code_type: row.string("code_type"),
            max_claims: row.i32("max_claims"),
            claimed_quantity: row.i32("claimed_quantity"),
            starts_at: row.optional_string("starts_at"),
            expires_at: row.optional_string("expires_at"),
            status: row.i32("status"),
        })
        .collect();
    Ok((items, count))
}

async fn load_discount_applications(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    query: &ListParams,
    page: OffsetListPageParams,
) -> Result<(Vec<DiscountApplicationItem>, i64), sqlx::Error> {
    let search = normalized_search(query);
    let count_sql = "SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(application_no) LIKE $3 OR LOWER(COALESCE(order_no, '')) LIKE $3) AND ($4 IS NULL OR status = $4)";
    let list_sql = "SELECT id, application_no, order_id, order_no, offer_id, discount_type, CAST(discount_amount AS TEXT) AS discount_amount, currency_code, status, CAST(applied_at AS TEXT) AS applied_at, CAST(settled_at AS TEXT) AS settled_at, CAST(released_at AS TEXT) AS released_at, CAST(rolled_back_at AS TEXT) AS rolled_back_at FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(application_no) LIKE $3 OR LOWER(COALESCE(order_no, '')) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY applied_at DESC LIMIT $5 OFFSET $6";
    let (count, rows) = query_rows(
        pool,
        scope,
        query.status,
        &search,
        count_sql,
        list_sql,
        page,
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| DiscountApplicationItem {
            id: row.i64("id").to_string(),
            application_no: row.string("application_no"),
            order_id: row.i64("order_id").to_string(),
            order_no: row.optional_string("order_no"),
            offer_id: row.i64("offer_id").to_string(),
            discount_type: row.string("discount_type"),
            discount_amount: row.string("discount_amount"),
            currency_code: row.string("currency_code"),
            status: row.i32("status"),
            applied_at: row.string("applied_at"),
            settled_at: row.optional_string("settled_at"),
            released_at: row.optional_string("released_at"),
            rolled_back_at: row.optional_string("rolled_back_at"),
        })
        .collect();
    Ok((items, count))
}

async fn query_rows(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    status: Option<i32>,
    search: &str,
    count_sql: &str,
    list_sql: &str,
    page: OffsetListPageParams,
) -> Result<(i64, Vec<PromotionRow>), sqlx::Error> {
    match pool {
        PromotionPool::Postgres(pool) => {
            let total = sqlx::query_scalar::<_, i64>(count_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(search)
                .bind(status)
                .fetch_one(pool)
                .await?;
            let rows = sqlx::query(list_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(search)
                .bind(status)
                .bind(page.page_size)
                .bind(offset(page))
                .fetch_all(pool)
                .await?
                .into_iter()
                .map(PromotionRow::Postgres)
                .collect();
            Ok((total, rows))
        }
        PromotionPool::Sqlite(pool) => {
            let count_sql = sqlite_parameters(count_sql);
            let list_sql = sqlite_parameters(list_sql);
            let total = sqlx::query_scalar::<_, i64>(&count_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(search)
                .bind(status)
                .fetch_one(pool)
                .await?;
            let rows = sqlx::query(&list_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(search)
                .bind(status)
                .bind(page.page_size)
                .bind(offset(page))
                .fetch_all(pool)
                .await?
                .into_iter()
                .map(PromotionRow::Sqlite)
                .collect();
            Ok((total, rows))
        }
    }
}

fn sqlite_parameters(sql: &str) -> String {
    (1..=6).fold(sql.to_owned(), |value, index| {
        value.replace(&format!("${index}"), &format!("?{index}"))
    })
}

async fn set_offer_status(
    pool: &PromotionPool,
    scope: &BackendOperatorScope,
    offer_id: i64,
    status: i32,
) -> Result<bool, sqlx::Error> {
    let affected = match pool {
        PromotionPool::Postgres(pool) => sqlx::query("UPDATE promotion_offer SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 AND organization_id = $4").bind(status).bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await?.rows_affected(),
        PromotionPool::Sqlite(pool) => sqlx::query("UPDATE promotion_offer SET status = ?1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 AND tenant_id = ?3 AND organization_id = ?4").bind(status).bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await?.rows_affected(),
    };
    Ok(affected == 1)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("sqlite pool");
        for statement in [
            "CREATE TABLE promotion_offer (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, offer_no TEXT NOT NULL, offer_code TEXT, offer_type TEXT NOT NULL, display_name TEXT NOT NULL, description TEXT, priority INTEGER NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT, status INTEGER NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
            "CREATE TABLE promotion_coupon_stock (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, total_quantity INTEGER NOT NULL, available_quantity INTEGER NOT NULL, claimed_quantity INTEGER NOT NULL, redeemed_quantity INTEGER NOT NULL, status INTEGER NOT NULL)",
            "CREATE TABLE promotion_code (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, status INTEGER NOT NULL)",
            "CREATE TABLE promotion_discount_application (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL)",
            "INSERT INTO promotion_offer VALUES (1, 100001, 0, 'offer-1', 'launch', 'COUPON', 'Launch', NULL, 10, '2026-01-01', NULL, 1, 0, '2026-01-01', '2026-01-01')",
            "INSERT INTO promotion_offer VALUES (2, 200002, 0, 'offer-2', 'other', 'COUPON', 'Other tenant', NULL, 5, '2026-01-01', NULL, 1, 0, '2026-01-01', '2026-01-01')",
            "INSERT INTO promotion_coupon_stock VALUES (1, 100001, 0, 100, 80, 15, 5, 1)",
            "INSERT INTO promotion_code VALUES (1, 100001, 0, 1)",
            "INSERT INTO promotion_discount_application VALUES (1, 100001, 0)",
        ] {
            sqlx::query(statement).execute(&pool).await.expect("schema or seed");
        }
        pool
    }

    #[tokio::test]
    async fn overview_and_offer_status_are_tenant_scoped() {
        let pool = test_pool().await;
        let storage = PromotionPool::Sqlite(pool.clone());
        let scope = BackendOperatorScope { tenant_id: 100001, organization_id: 0 };

        let overview = load_overview(&storage, &scope).await.expect("overview");
        assert_eq!(overview.total_offers, 1);
        assert_eq!(overview.total_coupon_stock, 100);
        assert_eq!(overview.active_codes, 1);
        assert_eq!(overview.discount_applications, 1);

        assert!(set_offer_status(&storage, &scope, 1, 0).await.expect("status update"));
        assert!(!set_offer_status(&storage, &scope, 2, 0).await.expect("tenant guard"));
        let status: i32 = sqlx::query_scalar("SELECT status FROM promotion_offer WHERE id = 1")
            .fetch_one(&pool)
            .await
            .expect("status");
        assert_eq!(status, 0);
    }

    #[tokio::test]
    async fn offer_list_uses_store_level_pagination() {
        let storage = PromotionPool::Sqlite(test_pool().await);
        let scope = BackendOperatorScope { tenant_id: 100001, organization_id: 0 };
        let query = ListParams { page: Some(1), page_size: Some(1), q: Some("launch".to_owned()), status: Some(1) };
        let page = OffsetListPageParams::parse(query.page, query.page_size);

        let (items, total) = load_offers(&storage, &scope, &query, page).await.expect("offer list");

        assert_eq!(total, 1);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].display_name, "Launch");
    }
}
