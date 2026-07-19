use sdkwork_commerce_promotion_service::{
    PromotionAdminFuture, PromotionAdminListQuery, PromotionAdminPage,
    PromotionAdminRepositoryPort, PromotionAdminScope, PromotionAdminUserCouponItem,
    PromotionCampaignInput, PromotionCampaignItem, PromotionCodeBatchInput, PromotionCodeBatchItem,
    PromotionCodeItem, PromotionCouponLedgerItem, PromotionCouponStockInput,
    PromotionCouponStockItem, PromotionDiscountApplicationItem, PromotionDistributionInput,
    PromotionDistributionTaskItem, PromotionOfferInput, PromotionOfferItem, PromotionOverview,
};
use sdkwork_contract_service::CommerceServiceError;
use sqlx::postgres::PgRow;
use sqlx::sqlite::SqliteRow;
use sqlx::{PgPool, Row, SqlitePool};

const POSTGRES_OVERVIEW_SQL: &str = r#"
SELECT
    COUNT(*)::BIGINT AS total_offers,
    COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS active_offers,
    COALESCE((SELECT SUM(total_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0)::BIGINT AS total_coupon_stock,
    COALESCE((SELECT SUM(available_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0)::BIGINT AS available_coupons,
    COALESCE((SELECT SUM(claimed_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0)::BIGINT AS claimed_coupons,
    COALESCE((SELECT SUM(redeemed_quantity) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2), 0)::BIGINT AS redeemed_coupons,
    COALESCE((SELECT COUNT(*) FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND status = 1), 0)::BIGINT AS active_codes,
    COALESCE((SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2), 0)::BIGINT AS discount_applications
FROM promotion_offer
WHERE tenant_id = $1 AND organization_id = $2
"#;

const SQLITE_OVERVIEW_SQL: &str = r#"
SELECT
    CAST(COUNT(*) AS INTEGER) AS total_offers,
    CAST(COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0) AS INTEGER) AS active_offers,
    CAST(COALESCE((SELECT SUM(total_quantity) FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2), 0) AS INTEGER) AS total_coupon_stock,
    CAST(COALESCE((SELECT SUM(available_quantity) FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2), 0) AS INTEGER) AS available_coupons,
    CAST(COALESCE((SELECT SUM(claimed_quantity) FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2), 0) AS INTEGER) AS claimed_coupons,
    CAST(COALESCE((SELECT SUM(redeemed_quantity) FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2), 0) AS INTEGER) AS redeemed_coupons,
    CAST(COALESCE((SELECT COUNT(*) FROM promotion_code WHERE tenant_id = ?1 AND organization_id = ?2 AND status = 1), 0) AS INTEGER) AS active_codes,
    CAST(COALESCE((SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = ?1 AND organization_id = ?2), 0) AS INTEGER) AS discount_applications
FROM promotion_offer
WHERE tenant_id = ?1 AND organization_id = ?2
"#;

const POSTGRES_OFFER_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_offer WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(display_name) LIKE $3 OR LOWER(COALESCE(offer_code, '')) LIKE $3) AND ($4 IS NULL OR status = $4)";
const POSTGRES_OFFER_LIST_SQL: &str = "SELECT o.id, o.campaign_id, o.offer_no, o.offer_code, o.offer_type, o.display_name, o.description, o.priority, CAST(o.starts_at AS TEXT) AS starts_at, CAST(o.ends_at AS TEXT) AS ends_at, o.status, v.discount_type, CAST(v.discount_value AS TEXT) AS discount_value, CAST(v.minimum_amount AS TEXT) AS minimum_amount, CAST(v.maximum_discount_amount AS TEXT) AS maximum_discount_amount, v.currency_code, o.version, CAST(o.updated_at AS TEXT) AS updated_at FROM promotion_offer o LEFT JOIN promotion_offer_version v ON v.id = o.current_offer_version_id AND v.tenant_id = o.tenant_id WHERE o.tenant_id = $1 AND o.organization_id = $2 AND ($3 = '%%' OR LOWER(o.display_name) LIKE $3 OR LOWER(COALESCE(o.offer_code, '')) LIKE $3) AND ($4 IS NULL OR o.status = $4) ORDER BY o.priority DESC, o.starts_at DESC LIMIT $5 OFFSET $6";
const SQLITE_OFFER_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_offer WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(display_name) LIKE ?3 OR LOWER(COALESCE(offer_code, '')) LIKE ?3) AND (?4 IS NULL OR status = ?4)";
const SQLITE_OFFER_LIST_SQL: &str = "SELECT o.id, o.campaign_id, o.offer_no, o.offer_code, o.offer_type, o.display_name, o.description, o.priority, CAST(o.starts_at AS TEXT) AS starts_at, CAST(o.ends_at AS TEXT) AS ends_at, o.status, v.discount_type, CAST(v.discount_value AS TEXT) AS discount_value, CAST(v.minimum_amount AS TEXT) AS minimum_amount, CAST(v.maximum_discount_amount AS TEXT) AS maximum_discount_amount, v.currency_code, o.version, CAST(o.updated_at AS TEXT) AS updated_at FROM promotion_offer o LEFT JOIN promotion_offer_version v ON v.id = o.current_offer_version_id AND v.tenant_id = o.tenant_id WHERE o.tenant_id = ?1 AND o.organization_id = ?2 AND (?3 = '%%' OR LOWER(o.display_name) LIKE ?3 OR LOWER(COALESCE(o.offer_code, '')) LIKE ?3) AND (?4 IS NULL OR o.status = ?4) ORDER BY o.priority DESC, o.starts_at DESC LIMIT ?5 OFFSET ?6";

const POSTGRES_STOCK_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(stock_no) LIKE $3) AND ($4 IS NULL OR status = $4)";
const POSTGRES_STOCK_LIST_SQL: &str = "SELECT id, offer_id, stock_no, stock_type, total_quantity, available_quantity, claimed_quantity, redeemed_quantity, locked_quantity, per_user_limit, CAST(claim_starts_at AS TEXT) AS claim_starts_at, CAST(claim_ends_at AS TEXT) AS claim_ends_at, status FROM promotion_coupon_stock WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(stock_no) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY created_at DESC LIMIT $5 OFFSET $6";
const SQLITE_STOCK_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(stock_no) LIKE ?3) AND (?4 IS NULL OR status = ?4)";
const SQLITE_STOCK_LIST_SQL: &str = "SELECT id, offer_id, stock_no, stock_type, total_quantity, available_quantity, claimed_quantity, redeemed_quantity, locked_quantity, per_user_limit, CAST(claim_starts_at AS TEXT) AS claim_starts_at, CAST(claim_ends_at AS TEXT) AS claim_ends_at, status FROM promotion_coupon_stock WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(stock_no) LIKE ?3) AND (?4 IS NULL OR status = ?4) ORDER BY created_at DESC LIMIT ?5 OFFSET ?6";

const POSTGRES_CODE_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(promotion_code) LIKE $3 OR LOWER(code_no) LIKE $3) AND ($4 IS NULL OR status = $4)";
const POSTGRES_CODE_LIST_SQL: &str = "SELECT id, stock_id, offer_id, code_no, promotion_code, code_type, max_claims, claimed_quantity, CAST(starts_at AS TEXT) AS starts_at, CAST(expires_at AS TEXT) AS expires_at, status FROM promotion_code WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(promotion_code) LIKE $3 OR LOWER(code_no) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY created_at DESC LIMIT $5 OFFSET $6";
const SQLITE_CODE_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_code WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(promotion_code) LIKE ?3 OR LOWER(code_no) LIKE ?3) AND (?4 IS NULL OR status = ?4)";
const SQLITE_CODE_LIST_SQL: &str = "SELECT id, stock_id, offer_id, code_no, promotion_code, code_type, max_claims, claimed_quantity, CAST(starts_at AS TEXT) AS starts_at, CAST(expires_at AS TEXT) AS expires_at, status FROM promotion_code WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(promotion_code) LIKE ?3 OR LOWER(code_no) LIKE ?3) AND (?4 IS NULL OR status = ?4) ORDER BY created_at DESC LIMIT ?5 OFFSET ?6";

const POSTGRES_APPLICATION_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(application_no) LIKE $3 OR LOWER(COALESCE(order_no, '')) LIKE $3) AND ($4 IS NULL OR status = $4)";
const POSTGRES_APPLICATION_LIST_SQL: &str = "SELECT id, application_no, order_id, order_no, offer_id, discount_type, CAST(discount_amount AS TEXT) AS discount_amount, currency_code, status, CAST(applied_at AS TEXT) AS applied_at, CAST(settled_at AS TEXT) AS settled_at, CAST(released_at AS TEXT) AS released_at, CAST(rolled_back_at AS TEXT) AS rolled_back_at FROM promotion_discount_application WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(application_no) LIKE $3 OR LOWER(COALESCE(order_no, '')) LIKE $3) AND ($4 IS NULL OR status = $4) ORDER BY applied_at DESC LIMIT $5 OFFSET $6";
const SQLITE_APPLICATION_COUNT_SQL: &str = "SELECT COUNT(*) FROM promotion_discount_application WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(application_no) LIKE ?3 OR LOWER(COALESCE(order_no, '')) LIKE ?3) AND (?4 IS NULL OR status = ?4)";
const SQLITE_APPLICATION_LIST_SQL: &str = "SELECT id, application_no, order_id, order_no, offer_id, discount_type, CAST(discount_amount AS TEXT) AS discount_amount, currency_code, status, CAST(applied_at AS TEXT) AS applied_at, CAST(settled_at AS TEXT) AS settled_at, CAST(released_at AS TEXT) AS released_at, CAST(rolled_back_at AS TEXT) AS rolled_back_at FROM promotion_discount_application WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(application_no) LIKE ?3 OR LOWER(COALESCE(order_no, '')) LIKE ?3) AND (?4 IS NULL OR status = ?4) ORDER BY applied_at DESC LIMIT ?5 OFFSET ?6";

#[derive(Clone)]
pub struct PostgresPromotionAdminRepository {
    pool: PgPool,
}

impl PostgresPromotionAdminRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(Clone)]
pub struct SqlitePromotionAdminRepository {
    pool: SqlitePool,
}

impl SqlitePromotionAdminRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[derive(Clone)]
pub(crate) enum AdminPool {
    Postgres(PgPool),
    Sqlite(SqlitePool),
}

enum AdminRow {
    Postgres(PgRow),
    Sqlite(SqliteRow),
}

impl AdminRow {
    fn i32(&self, name: &str) -> Result<i32, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode_error(name, error))
    }

    fn i64(&self, name: &str) -> Result<i64, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode_error(name, error))
    }

    fn string(&self, name: &str) -> Result<String, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode_error(name, error))
    }

    fn optional_string(&self, name: &str) -> Result<Option<String>, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode_error(name, error))
    }

    fn optional_i64(&self, name: &str) -> Result<Option<i64>, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode_error(name, error))
    }
}

macro_rules! impl_admin_repository {
    ($repository:ty, $variant:ident) => {
        impl PromotionAdminRepositoryPort for $repository {
            fn retrieve_overview<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
            ) -> PromotionAdminFuture<'a, PromotionOverview> {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    retrieve_overview(&pool, scope).await
                })
            }

            fn list_campaigns<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCampaignItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::list_campaigns(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        query,
                    )
                    .await
                })
            }

            fn retrieve_campaign<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                campaign_id: i64,
            ) -> PromotionAdminFuture<'a, Option<PromotionCampaignItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::retrieve_campaign(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        campaign_id,
                    )
                    .await
                })
            }

            fn create_campaign<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                input: &'a PromotionCampaignInput,
            ) -> PromotionAdminFuture<'a, PromotionCampaignItem> {
                Box::pin(async move {
                    crate::promotion_admin_management::create_campaign(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        input,
                    )
                    .await
                })
            }

            fn update_campaign<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                campaign_id: i64,
                input: &'a PromotionCampaignInput,
            ) -> PromotionAdminFuture<'a, Option<PromotionCampaignItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::update_campaign(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        campaign_id,
                        input,
                    )
                    .await
                })
            }

            fn delete_campaign<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                campaign_id: i64,
            ) -> PromotionAdminFuture<'a, bool> {
                Box::pin(async move {
                    crate::promotion_admin_management::delete_campaign(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        campaign_id,
                    )
                    .await
                })
            }

            fn list_offers<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionOfferItem>> {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    list_offers(&pool, scope, query).await
                })
            }

            fn retrieve_offer<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                offer_id: i64,
            ) -> PromotionAdminFuture<'a, Option<PromotionOfferItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::retrieve_offer(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        offer_id,
                    )
                    .await
                })
            }

            fn create_offer<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                input: &'a PromotionOfferInput,
            ) -> PromotionAdminFuture<'a, PromotionOfferItem> {
                Box::pin(async move {
                    crate::promotion_admin_management::create_offer(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        input,
                    )
                    .await
                })
            }

            fn update_offer<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                offer_id: i64,
                input: &'a PromotionOfferInput,
            ) -> PromotionAdminFuture<'a, Option<PromotionOfferItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::update_offer(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        offer_id,
                        input,
                    )
                    .await
                })
            }

            fn update_offer_status<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                offer_id: i64,
                status: i32,
            ) -> PromotionAdminFuture<'a, bool> {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    update_offer_status(&pool, scope, offer_id, status).await
                })
            }

            fn delete_offer<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                offer_id: i64,
            ) -> PromotionAdminFuture<'a, bool> {
                Box::pin(async move {
                    crate::promotion_admin_management::delete_offer(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        offer_id,
                    )
                    .await
                })
            }

            fn list_coupon_stocks<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCouponStockItem>> {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    list_coupon_stocks(&pool, scope, query).await
                })
            }

            fn create_coupon_stock<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                input: &'a PromotionCouponStockInput,
            ) -> PromotionAdminFuture<'a, PromotionCouponStockItem> {
                Box::pin(async move {
                    crate::promotion_admin_management::create_coupon_stock(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        input,
                    )
                    .await
                })
            }

            fn list_code_batches<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCodeBatchItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::list_code_batches(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        query,
                    )
                    .await
                })
            }

            fn create_code_batch<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                input: &'a PromotionCodeBatchInput,
            ) -> PromotionAdminFuture<'a, PromotionCodeBatchItem> {
                Box::pin(async move {
                    crate::promotion_admin_management::create_code_batch(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        input,
                    )
                    .await
                })
            }

            fn list_codes<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCodeItem>> {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    list_codes(&pool, scope, query).await
                })
            }

            fn list_distribution_tasks<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionDistributionTaskItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::list_distribution_tasks(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        query,
                    )
                    .await
                })
            }

            fn create_distribution_task<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                input: &'a PromotionDistributionInput,
            ) -> PromotionAdminFuture<'a, PromotionDistributionTaskItem> {
                Box::pin(async move {
                    crate::promotion_admin_management::create_distribution_task(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        input,
                    )
                    .await
                })
            }

            fn list_user_coupons<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionAdminUserCouponItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::list_user_coupons(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        query,
                    )
                    .await
                })
            }

            fn list_coupon_ledger<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCouponLedgerItem>> {
                Box::pin(async move {
                    crate::promotion_admin_management::list_coupon_ledger(
                        &AdminPool::$variant(self.pool.clone()),
                        scope,
                        query,
                    )
                    .await
                })
            }

            fn list_discount_applications<'a>(
                &'a self,
                scope: &'a PromotionAdminScope,
                query: &'a PromotionAdminListQuery,
            ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionDiscountApplicationItem>>
            {
                Box::pin(async move {
                    let pool = AdminPool::$variant(self.pool.clone());
                    list_discount_applications(&pool, scope, query).await
                })
            }
        }
    };
}

impl_admin_repository!(PostgresPromotionAdminRepository, Postgres);
impl_admin_repository!(SqlitePromotionAdminRepository, Sqlite);

async fn retrieve_overview(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
) -> Result<PromotionOverview, CommerceServiceError> {
    let row = match pool {
        AdminPool::Postgres(pool) => AdminRow::Postgres(
            sqlx::query(POSTGRES_OVERVIEW_SQL)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_one(pool)
                .await
                .map_err(|error| storage_error("retrieve promotion overview", error))?,
        ),
        AdminPool::Sqlite(pool) => AdminRow::Sqlite(
            sqlx::query(SQLITE_OVERVIEW_SQL)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_one(pool)
                .await
                .map_err(|error| storage_error("retrieve promotion overview", error))?,
        ),
    };
    Ok(PromotionOverview {
        total_offers: row.i64("total_offers")?,
        active_offers: row.i64("active_offers")?,
        total_coupon_stock: row.i64("total_coupon_stock")?,
        available_coupons: row.i64("available_coupons")?,
        claimed_coupons: row.i64("claimed_coupons")?,
        redeemed_coupons: row.i64("redeemed_coupons")?,
        active_codes: row.i64("active_codes")?,
        discount_applications: row.i64("discount_applications")?,
    })
}

async fn list_offers(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionOfferItem>, CommerceServiceError> {
    let (total_items, rows) = query_page(
        pool,
        scope,
        query,
        POSTGRES_OFFER_COUNT_SQL,
        POSTGRES_OFFER_LIST_SQL,
        SQLITE_OFFER_COUNT_SQL,
        SQLITE_OFFER_LIST_SQL,
        "list promotion offers",
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| {
            Ok(PromotionOfferItem {
                id: row.i64("id")?.to_string(),
                campaign_id: row
                    .optional_i64("campaign_id")?
                    .map(|value| value.to_string()),
                offer_no: row.string("offer_no")?,
                offer_code: row.optional_string("offer_code")?,
                offer_type: row.string("offer_type")?,
                display_name: row.string("display_name")?,
                description: row.optional_string("description")?,
                priority: row.i32("priority")?,
                starts_at: row.string("starts_at")?,
                ends_at: row.optional_string("ends_at")?,
                status: row.i32("status")?,
                discount_type: row.optional_string("discount_type")?,
                discount_value: row.optional_string("discount_value")?,
                minimum_amount: row.optional_string("minimum_amount")?,
                maximum_discount_amount: row.optional_string("maximum_discount_amount")?,
                currency_code: row.optional_string("currency_code")?,
                version: row.i64("version")?,
                updated_at: row.string("updated_at")?,
            })
        })
        .collect::<Result<Vec<_>, CommerceServiceError>>()?;
    Ok(PromotionAdminPage { items, total_items })
}

async fn list_coupon_stocks(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionCouponStockItem>, CommerceServiceError> {
    let (total_items, rows) = query_page(
        pool,
        scope,
        query,
        POSTGRES_STOCK_COUNT_SQL,
        POSTGRES_STOCK_LIST_SQL,
        SQLITE_STOCK_COUNT_SQL,
        SQLITE_STOCK_LIST_SQL,
        "list promotion coupon stocks",
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| {
            Ok(PromotionCouponStockItem {
                id: row.i64("id")?.to_string(),
                offer_id: row.i64("offer_id")?.to_string(),
                stock_no: row.string("stock_no")?,
                stock_type: row.string("stock_type")?,
                total_quantity: row.i64("total_quantity")?,
                available_quantity: row.i64("available_quantity")?,
                claimed_quantity: row.i64("claimed_quantity")?,
                redeemed_quantity: row.i64("redeemed_quantity")?,
                locked_quantity: row.i64("locked_quantity")?,
                per_user_limit: row.i32("per_user_limit")?,
                claim_starts_at: row.optional_string("claim_starts_at")?,
                claim_ends_at: row.optional_string("claim_ends_at")?,
                status: row.i32("status")?,
            })
        })
        .collect::<Result<Vec<_>, CommerceServiceError>>()?;
    Ok(PromotionAdminPage { items, total_items })
}

async fn list_codes(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionCodeItem>, CommerceServiceError> {
    let (total_items, rows) = query_page(
        pool,
        scope,
        query,
        POSTGRES_CODE_COUNT_SQL,
        POSTGRES_CODE_LIST_SQL,
        SQLITE_CODE_COUNT_SQL,
        SQLITE_CODE_LIST_SQL,
        "list promotion codes",
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| {
            Ok(PromotionCodeItem {
                id: row.i64("id")?.to_string(),
                stock_id: row.i64("stock_id")?.to_string(),
                offer_id: row.i64("offer_id")?.to_string(),
                code_no: row.string("code_no")?,
                promotion_code: mask_code(&row.string("promotion_code")?),
                code_type: row.string("code_type")?,
                max_claims: row.i32("max_claims")?,
                claimed_quantity: row.i32("claimed_quantity")?,
                starts_at: row.optional_string("starts_at")?,
                expires_at: row.optional_string("expires_at")?,
                status: row.i32("status")?,
            })
        })
        .collect::<Result<Vec<_>, CommerceServiceError>>()?;
    Ok(PromotionAdminPage { items, total_items })
}

async fn list_discount_applications(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionDiscountApplicationItem>, CommerceServiceError> {
    let (total_items, rows) = query_page(
        pool,
        scope,
        query,
        POSTGRES_APPLICATION_COUNT_SQL,
        POSTGRES_APPLICATION_LIST_SQL,
        SQLITE_APPLICATION_COUNT_SQL,
        SQLITE_APPLICATION_LIST_SQL,
        "list promotion discount applications",
    )
    .await?;
    let items = rows
        .into_iter()
        .map(|row| {
            Ok(PromotionDiscountApplicationItem {
                id: row.i64("id")?.to_string(),
                application_no: row.string("application_no")?,
                order_id: row.i64("order_id")?.to_string(),
                order_no: row.optional_string("order_no")?,
                offer_id: row.i64("offer_id")?.to_string(),
                discount_type: row.string("discount_type")?,
                discount_amount: row.string("discount_amount")?,
                currency_code: row.string("currency_code")?,
                status: row.i32("status")?,
                applied_at: row.string("applied_at")?,
                settled_at: row.optional_string("settled_at")?,
                released_at: row.optional_string("released_at")?,
                rolled_back_at: row.optional_string("rolled_back_at")?,
            })
        })
        .collect::<Result<Vec<_>, CommerceServiceError>>()?;
    Ok(PromotionAdminPage { items, total_items })
}

async fn query_page(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
    postgres_count_sql: &str,
    postgres_list_sql: &str,
    sqlite_count_sql: &str,
    sqlite_list_sql: &str,
    operation: &str,
) -> Result<(i64, Vec<AdminRow>), CommerceServiceError> {
    let search = query.search_pattern();
    match pool {
        AdminPool::Postgres(pool) => {
            let total_items = sqlx::query_scalar::<_, i64>(postgres_count_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .fetch_one(pool)
                .await
                .map_err(|error| storage_error(operation, error))?;
            let rows = sqlx::query(postgres_list_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage_error(operation, error))?
                .into_iter()
                .map(AdminRow::Postgres)
                .collect();
            Ok((total_items, rows))
        }
        AdminPool::Sqlite(pool) => {
            let total_items = sqlx::query_scalar::<_, i64>(sqlite_count_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .fetch_one(pool)
                .await
                .map_err(|error| storage_error(operation, error))?;
            let rows = sqlx::query(sqlite_list_sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage_error(operation, error))?
                .into_iter()
                .map(AdminRow::Sqlite)
                .collect();
            Ok((total_items, rows))
        }
    }
}

async fn update_offer_status(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
    status: i32,
) -> Result<bool, CommerceServiceError> {
    let affected = match pool {
        AdminPool::Postgres(pool) => sqlx::query("UPDATE promotion_offer SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 AND organization_id = $4")
            .bind(status)
            .bind(offer_id)
            .bind(scope.tenant_id)
            .bind(scope.organization_id)
            .execute(pool)
            .await
            .map_err(|error| storage_error("update promotion offer status", error))?
            .rows_affected(),
        AdminPool::Sqlite(pool) => sqlx::query("UPDATE promotion_offer SET status = ?1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 AND tenant_id = ?3 AND organization_id = ?4")
            .bind(status)
            .bind(offer_id)
            .bind(scope.tenant_id)
            .bind(scope.organization_id)
            .execute(pool)
            .await
            .map_err(|error| storage_error("update promotion offer status", error))?
            .rows_affected(),
    };
    Ok(affected == 1)
}

fn storage_error(context: &str, error: sqlx::Error) -> CommerceServiceError {
    CommerceServiceError::storage(format!("{context}: {error}"))
}

fn decode_error(column: &str, error: sqlx::Error) -> CommerceServiceError {
    CommerceServiceError::storage(format!("decode promotion admin column {column}: {error}"))
}

fn mask_code(value: &str) -> String {
    if value.chars().count() <= 8 {
        return "****".to_owned();
    }
    let prefix = value.chars().take(4).collect::<String>();
    let suffix = value
        .chars()
        .rev()
        .take(4)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    format!("{prefix}****{suffix}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_commerce_promotion_service::PromotionAdminRepositoryPort;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("sqlite pool");
        for statement in [
            "CREATE TABLE promotion_offer (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, campaign_id INTEGER, offer_no TEXT NOT NULL, offer_code TEXT, offer_type TEXT NOT NULL, current_offer_version_id INTEGER, display_name TEXT NOT NULL, description TEXT, priority INTEGER NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT, status INTEGER NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
            "CREATE TABLE promotion_offer_version (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, offer_id INTEGER NOT NULL, discount_type TEXT NOT NULL, discount_value TEXT NOT NULL, minimum_amount TEXT NOT NULL, maximum_discount_amount TEXT, currency_code TEXT NOT NULL)",
            "CREATE TABLE promotion_coupon_stock (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, offer_id INTEGER NOT NULL, stock_no TEXT NOT NULL, stock_type TEXT NOT NULL, total_quantity INTEGER NOT NULL, available_quantity INTEGER NOT NULL, claimed_quantity INTEGER NOT NULL, redeemed_quantity INTEGER NOT NULL, locked_quantity INTEGER NOT NULL, per_user_limit INTEGER NOT NULL, claim_starts_at TEXT, claim_ends_at TEXT, status INTEGER NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE promotion_code (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, stock_id INTEGER NOT NULL, offer_id INTEGER NOT NULL, code_no TEXT NOT NULL, promotion_code TEXT NOT NULL, code_type TEXT NOT NULL, max_claims INTEGER NOT NULL, claimed_quantity INTEGER NOT NULL, starts_at TEXT, expires_at TEXT, status INTEGER NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE promotion_discount_application (id INTEGER PRIMARY KEY, tenant_id INTEGER NOT NULL, organization_id INTEGER NOT NULL, application_no TEXT NOT NULL, order_id INTEGER NOT NULL, order_no TEXT, offer_id INTEGER NOT NULL, discount_type TEXT NOT NULL, discount_amount TEXT NOT NULL, currency_code TEXT NOT NULL, status INTEGER NOT NULL, applied_at TEXT NOT NULL, settled_at TEXT, released_at TEXT, rolled_back_at TEXT)",
            "INSERT INTO promotion_offer VALUES (1, 100001, 300001, NULL, 'offer-1', 'launch', 'COUPON', 11, 'Launch', NULL, 10, '2026-01-01', NULL, 1, 0, '2026-01-01', '2026-01-01')",
            "INSERT INTO promotion_offer VALUES (2, 200002, 300001, NULL, 'offer-2', 'other', 'COUPON', 12, 'Other tenant', NULL, 5, '2026-01-01', NULL, 1, 0, '2026-01-01', '2026-01-01')",
            "INSERT INTO promotion_offer_version VALUES (11, 100001, 1, 'FIXED', '10', '100', NULL, 'CNY')",
            "INSERT INTO promotion_offer_version VALUES (12, 200002, 2, 'FIXED', '10', '100', NULL, 'CNY')",
            "INSERT INTO promotion_coupon_stock VALUES (1, 100001, 300001, 1, 'stock-1', 'LIMITED', 100, 80, 15, 5, 0, 1, NULL, NULL, 1, '2026-01-01')",
            "INSERT INTO promotion_code VALUES (1, 100001, 300001, 1, 1, 'code-1', 'WELCOME', 'PUBLIC', 10, 1, NULL, NULL, 1, '2026-01-01')",
            "INSERT INTO promotion_discount_application VALUES (1, 100001, 300001, 'application-1', 10, 'order-10', 1, 'FIXED', '500', 'CNY', 1, '2026-01-01', NULL, NULL, NULL)",
        ] {
            sqlx::query(statement)
                .execute(&pool)
                .await
                .expect("schema or seed");
        }
        pool
    }

    fn scope() -> PromotionAdminScope {
        PromotionAdminScope::new(100001, 300001, "900001").expect("scope")
    }

    #[tokio::test]
    async fn sqlite_overview_and_lists_are_tenant_scoped_and_store_paginated() {
        let repository = SqlitePromotionAdminRepository::new(test_pool().await);
        let overview = repository
            .retrieve_overview(&scope())
            .await
            .expect("overview");
        assert_eq!(overview.total_offers, 1);
        assert_eq!(overview.total_coupon_stock, 100);
        assert_eq!(overview.active_codes, 1);
        assert_eq!(overview.discount_applications, 1);

        let query =
            PromotionAdminListQuery::new(1, 1, Some("launch"), Some(1)).expect("list query");
        let offers = repository
            .list_offers(&scope(), &query)
            .await
            .expect("offers");
        assert_eq!(offers.total_items, 1);
        assert_eq!(offers.items.len(), 1);
        assert_eq!(offers.items[0].display_name, "Launch");
    }

    #[tokio::test]
    async fn sqlite_status_update_cannot_cross_tenant_boundary() {
        let pool = test_pool().await;
        let repository = SqlitePromotionAdminRepository::new(pool.clone());
        assert!(repository
            .update_offer_status(&scope(), 1, 0)
            .await
            .expect("status update"));
        assert!(!repository
            .update_offer_status(&scope(), 2, 0)
            .await
            .expect("tenant guard"));
        let status: i32 = sqlx::query_scalar("SELECT status FROM promotion_offer WHERE id = 1")
            .fetch_one(&pool)
            .await
            .expect("status");
        assert_eq!(status, 0);
    }

    #[test]
    fn postgres_overview_casts_bigint_aggregates_before_i64_decode() {
        for alias in [
            "total_coupon_stock",
            "available_coupons",
            "claimed_coupons",
            "redeemed_coupons",
        ] {
            let marker = format!(")::BIGINT AS {alias}");
            assert!(POSTGRES_OVERVIEW_SQL.contains(&marker), "missing {marker}");
        }
    }
}
