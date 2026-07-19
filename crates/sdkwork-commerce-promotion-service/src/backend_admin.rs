use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use sdkwork_contract_service::CommerceServiceError;

pub type PromotionAdminFuture<'a, T> =
    Pin<Box<dyn Future<Output = Result<T, CommerceServiceError>> + Send + 'a>>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionAdminScope {
    pub tenant_id: i64,
    pub organization_id: i64,
    pub user_id: String,
}

impl PromotionAdminScope {
    pub fn new(
        tenant_id: i64,
        organization_id: i64,
        user_id: impl Into<String>,
    ) -> Result<Self, CommerceServiceError> {
        let user_id = user_id.into();
        if tenant_id <= 0 {
            return Err(CommerceServiceError::validation(
                "tenant_id must be a positive integer",
            ));
        }
        if organization_id < 0 {
            return Err(CommerceServiceError::validation(
                "organization_id must not be negative",
            ));
        }
        if user_id.trim().is_empty() {
            return Err(CommerceServiceError::validation("user_id is required"));
        }
        Ok(Self {
            tenant_id,
            organization_id,
            user_id: user_id.trim().to_owned(),
        })
    }

    pub fn actor_id(&self) -> Result<i64, CommerceServiceError> {
        self.user_id
            .parse::<i64>()
            .ok()
            .filter(|value| *value > 0)
            .ok_or_else(|| CommerceServiceError::validation("user_id must be numeric"))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionAdminListQuery {
    pub page: i64,
    pub page_size: i64,
    pub query: Option<String>,
    pub status: Option<i32>,
}

impl PromotionAdminListQuery {
    pub fn new(
        page: i64,
        page_size: i64,
        query: Option<&str>,
        status: Option<i32>,
    ) -> Result<Self, CommerceServiceError> {
        if page < 1 {
            return Err(CommerceServiceError::validation("page must be at least 1"));
        }
        if !(1..=200).contains(&page_size) {
            return Err(CommerceServiceError::validation(
                "page_size must be between 1 and 200",
            ));
        }
        Ok(Self {
            page,
            page_size,
            query: optional_text(query),
            status,
        })
    }

    pub fn offset(&self) -> i64 {
        (self.page - 1) * self.page_size
    }

    pub fn search_pattern(&self) -> String {
        format!(
            "%{}%",
            self.query
                .as_deref()
                .unwrap_or_default()
                .to_ascii_lowercase()
        )
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionAdminPage<T> {
    pub items: Vec<T>,
    pub total_items: i64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionOverview {
    pub active_offers: i64,
    pub total_offers: i64,
    pub total_coupon_stock: i64,
    pub available_coupons: i64,
    pub claimed_coupons: i64,
    pub redeemed_coupons: i64,
    pub active_codes: i64,
    pub discount_applications: i64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCampaignItem {
    pub id: String,
    pub campaign_no: String,
    pub campaign_code: Option<String>,
    pub display_name: String,
    pub description: Option<String>,
    pub channel_scope: String,
    pub audience_scope: String,
    pub starts_at: String,
    pub ends_at: Option<String>,
    pub status: String,
    pub version: i64,
    pub updated_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCampaignInput {
    pub campaign_code: Option<String>,
    pub display_name: String,
    pub description: Option<String>,
    pub channel_scope: String,
    pub audience_scope: String,
    pub starts_at: String,
    pub ends_at: Option<String>,
    pub status: String,
    pub version: Option<i64>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PromotionOfferItem {
    pub id: String,
    pub campaign_id: Option<String>,
    pub offer_no: String,
    pub offer_code: Option<String>,
    pub offer_type: String,
    pub display_name: String,
    pub description: Option<String>,
    pub priority: i32,
    pub starts_at: String,
    pub ends_at: Option<String>,
    pub status: i32,
    pub discount_type: Option<String>,
    pub discount_value: Option<String>,
    pub minimum_amount: Option<String>,
    pub maximum_discount_amount: Option<String>,
    pub currency_code: Option<String>,
    pub version: i64,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PromotionOfferInput {
    pub campaign_id: Option<i64>,
    pub offer_code: Option<String>,
    pub offer_type: String,
    pub display_name: String,
    pub description: Option<String>,
    pub audience_scope: String,
    pub combinability: String,
    pub goods_scope: String,
    pub priority: i32,
    pub starts_at: String,
    pub ends_at: Option<String>,
    pub status: i32,
    pub discount_type: String,
    pub discount_value: String,
    pub minimum_amount: String,
    pub maximum_discount_amount: Option<String>,
    pub currency_code: String,
    pub version: Option<i64>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCouponStockItem {
    pub id: String,
    pub offer_id: String,
    pub stock_no: String,
    pub stock_type: String,
    pub total_quantity: i64,
    pub available_quantity: i64,
    pub claimed_quantity: i64,
    pub redeemed_quantity: i64,
    pub locked_quantity: i64,
    pub per_user_limit: i32,
    pub claim_starts_at: Option<String>,
    pub claim_ends_at: Option<String>,
    pub status: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCouponStockInput {
    pub offer_id: i64,
    pub stock_type: String,
    pub total_quantity: i64,
    pub per_user_limit: i32,
    pub claim_starts_at: Option<String>,
    pub claim_ends_at: Option<String>,
    pub status: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCodeItem {
    pub id: String,
    pub stock_id: String,
    pub offer_id: String,
    pub code_no: String,
    pub promotion_code: String,
    pub code_type: String,
    pub max_claims: i32,
    pub claimed_quantity: i32,
    pub starts_at: Option<String>,
    pub expires_at: Option<String>,
    pub status: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCodeBatchItem {
    pub id: String,
    pub stock_id: String,
    pub offer_id: String,
    pub batch_no: String,
    pub code_type: String,
    pub requested_quantity: i64,
    pub generated_quantity: i64,
    pub code_length: i32,
    pub code_prefix: String,
    pub starts_at: Option<String>,
    pub expires_at: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCodeBatchInput {
    pub stock_id: i64,
    pub code_type: String,
    pub quantity: i64,
    pub code_length: i32,
    pub code_prefix: String,
    pub starts_at: Option<String>,
    pub expires_at: Option<String>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionDistributionTaskItem {
    pub id: String,
    pub stock_id: String,
    pub offer_id: String,
    pub task_no: String,
    pub distribution_type: String,
    pub requested_quantity: i64,
    pub succeeded_quantity: i64,
    pub failed_quantity: i64,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionDistributionInput {
    pub stock_id: i64,
    pub owner_user_ids: Vec<i64>,
    pub idempotency_key: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionAdminUserCouponItem {
    pub id: String,
    pub coupon_no: String,
    pub stock_id: String,
    pub offer_id: String,
    pub owner_user_id: String,
    pub coupon_code: String,
    pub status: i32,
    pub claimed_at: String,
    pub valid_from: String,
    pub expires_at: Option<String>,
    pub redeemed_at: Option<String>,
    pub source_type: Option<String>,
    pub source_id: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCouponLedgerItem {
    pub id: String,
    pub stock_id: String,
    pub user_coupon_id: Option<String>,
    pub offer_id: String,
    pub subject_id: Option<String>,
    pub direction: String,
    pub quantity_delta: i64,
    pub balance_after: i64,
    pub business_type: String,
    pub business_no: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionDiscountApplicationItem {
    pub id: String,
    pub application_no: String,
    pub order_id: String,
    pub order_no: Option<String>,
    pub offer_id: String,
    pub discount_type: String,
    pub discount_amount: String,
    pub currency_code: String,
    pub status: i32,
    pub applied_at: String,
    pub settled_at: Option<String>,
    pub released_at: Option<String>,
    pub rolled_back_at: Option<String>,
}

pub trait PromotionAdminRepositoryPort: Send + Sync {
    fn retrieve_overview<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
    ) -> PromotionAdminFuture<'a, PromotionOverview>;
    fn list_campaigns<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCampaignItem>>;
    fn retrieve_campaign<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        campaign_id: i64,
    ) -> PromotionAdminFuture<'a, Option<PromotionCampaignItem>>;
    fn create_campaign<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        input: &'a PromotionCampaignInput,
    ) -> PromotionAdminFuture<'a, PromotionCampaignItem>;
    fn update_campaign<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        campaign_id: i64,
        input: &'a PromotionCampaignInput,
    ) -> PromotionAdminFuture<'a, Option<PromotionCampaignItem>>;
    fn delete_campaign<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        campaign_id: i64,
    ) -> PromotionAdminFuture<'a, bool>;
    fn list_offers<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionOfferItem>>;
    fn retrieve_offer<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        offer_id: i64,
    ) -> PromotionAdminFuture<'a, Option<PromotionOfferItem>>;
    fn create_offer<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        input: &'a PromotionOfferInput,
    ) -> PromotionAdminFuture<'a, PromotionOfferItem>;
    fn update_offer<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        offer_id: i64,
        input: &'a PromotionOfferInput,
    ) -> PromotionAdminFuture<'a, Option<PromotionOfferItem>>;
    fn update_offer_status<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        offer_id: i64,
        status: i32,
    ) -> PromotionAdminFuture<'a, bool>;
    fn delete_offer<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        offer_id: i64,
    ) -> PromotionAdminFuture<'a, bool>;
    fn list_coupon_stocks<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCouponStockItem>>;
    fn create_coupon_stock<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        input: &'a PromotionCouponStockInput,
    ) -> PromotionAdminFuture<'a, PromotionCouponStockItem>;
    fn list_code_batches<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCodeBatchItem>>;
    fn create_code_batch<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        input: &'a PromotionCodeBatchInput,
    ) -> PromotionAdminFuture<'a, PromotionCodeBatchItem>;
    fn list_codes<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCodeItem>>;
    fn list_distribution_tasks<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionDistributionTaskItem>>;
    fn create_distribution_task<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        input: &'a PromotionDistributionInput,
    ) -> PromotionAdminFuture<'a, PromotionDistributionTaskItem>;
    fn list_user_coupons<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionAdminUserCouponItem>>;
    fn list_coupon_ledger<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionCouponLedgerItem>>;
    fn list_discount_applications<'a>(
        &'a self,
        scope: &'a PromotionAdminScope,
        query: &'a PromotionAdminListQuery,
    ) -> PromotionAdminFuture<'a, PromotionAdminPage<PromotionDiscountApplicationItem>>;
}

#[derive(Clone)]
pub struct PromotionAdminService {
    repository: Arc<dyn PromotionAdminRepositoryPort>,
}

impl PromotionAdminService {
    pub fn new(repository: Arc<dyn PromotionAdminRepositoryPort>) -> Self {
        Self { repository }
    }

    pub async fn retrieve_overview(
        &self,
        scope: &PromotionAdminScope,
    ) -> Result<PromotionOverview, CommerceServiceError> {
        self.repository.retrieve_overview(scope).await
    }
    pub async fn list_campaigns(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionCampaignItem>, CommerceServiceError> {
        self.repository.list_campaigns(scope, query).await
    }
    pub async fn retrieve_campaign(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
    ) -> Result<Option<PromotionCampaignItem>, CommerceServiceError> {
        positive_id("campaign_id", id)?;
        self.repository.retrieve_campaign(scope, id).await
    }
    pub async fn create_campaign(
        &self,
        scope: &PromotionAdminScope,
        input: &PromotionCampaignInput,
    ) -> Result<PromotionCampaignItem, CommerceServiceError> {
        scope.actor_id()?;
        validate_campaign(input)?;
        self.repository.create_campaign(scope, input).await
    }
    pub async fn update_campaign(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
        input: &PromotionCampaignInput,
    ) -> Result<Option<PromotionCampaignItem>, CommerceServiceError> {
        positive_id("campaign_id", id)?;
        validate_campaign(input)?;
        if input.version.is_none() {
            return Err(CommerceServiceError::validation("version is required"));
        }
        self.repository.update_campaign(scope, id, input).await
    }
    pub async fn delete_campaign(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
    ) -> Result<bool, CommerceServiceError> {
        positive_id("campaign_id", id)?;
        self.repository.delete_campaign(scope, id).await
    }
    pub async fn list_offers(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionOfferItem>, CommerceServiceError> {
        self.repository.list_offers(scope, query).await
    }
    pub async fn retrieve_offer(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
    ) -> Result<Option<PromotionOfferItem>, CommerceServiceError> {
        positive_id("offer_id", id)?;
        self.repository.retrieve_offer(scope, id).await
    }
    pub async fn create_offer(
        &self,
        scope: &PromotionAdminScope,
        input: &PromotionOfferInput,
    ) -> Result<PromotionOfferItem, CommerceServiceError> {
        validate_offer(input)?;
        self.repository.create_offer(scope, input).await
    }
    pub async fn update_offer(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
        input: &PromotionOfferInput,
    ) -> Result<Option<PromotionOfferItem>, CommerceServiceError> {
        positive_id("offer_id", id)?;
        validate_offer(input)?;
        if input.version.is_none() {
            return Err(CommerceServiceError::validation("version is required"));
        }
        self.repository.update_offer(scope, id, input).await
    }
    pub async fn update_offer_status(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
        status: i32,
    ) -> Result<bool, CommerceServiceError> {
        positive_id("offer_id", id)?;
        binary_status(status)?;
        self.repository.update_offer_status(scope, id, status).await
    }
    pub async fn delete_offer(
        &self,
        scope: &PromotionAdminScope,
        id: i64,
    ) -> Result<bool, CommerceServiceError> {
        positive_id("offer_id", id)?;
        self.repository.delete_offer(scope, id).await
    }
    pub async fn list_coupon_stocks(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionCouponStockItem>, CommerceServiceError> {
        self.repository.list_coupon_stocks(scope, query).await
    }
    pub async fn create_coupon_stock(
        &self,
        scope: &PromotionAdminScope,
        input: &PromotionCouponStockInput,
    ) -> Result<PromotionCouponStockItem, CommerceServiceError> {
        positive_id("offer_id", input.offer_id)?;
        if input.total_quantity <= 0 || input.per_user_limit <= 0 {
            return Err(CommerceServiceError::validation(
                "total_quantity and per_user_limit must be positive",
            ));
        }
        binary_status(input.status)?;
        self.repository.create_coupon_stock(scope, input).await
    }
    pub async fn list_code_batches(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionCodeBatchItem>, CommerceServiceError> {
        self.repository.list_code_batches(scope, query).await
    }
    pub async fn create_code_batch(
        &self,
        scope: &PromotionAdminScope,
        input: &PromotionCodeBatchInput,
    ) -> Result<PromotionCodeBatchItem, CommerceServiceError> {
        positive_id("stock_id", input.stock_id)?;
        if !(1..=5000).contains(&input.quantity) {
            return Err(CommerceServiceError::validation(
                "quantity must be between 1 and 5000",
            ));
        }
        if !(12..=32).contains(&input.code_length) {
            return Err(CommerceServiceError::validation(
                "code_length must be between 12 and 32",
            ));
        }
        required("idempotency_key", &input.idempotency_key)?;
        self.repository.create_code_batch(scope, input).await
    }
    pub async fn list_codes(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionCodeItem>, CommerceServiceError> {
        self.repository.list_codes(scope, query).await
    }
    pub async fn list_distribution_tasks(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionDistributionTaskItem>, CommerceServiceError> {
        self.repository.list_distribution_tasks(scope, query).await
    }
    pub async fn create_distribution_task(
        &self,
        scope: &PromotionAdminScope,
        input: &PromotionDistributionInput,
    ) -> Result<PromotionDistributionTaskItem, CommerceServiceError> {
        positive_id("stock_id", input.stock_id)?;
        required("idempotency_key", &input.idempotency_key)?;
        if input.owner_user_ids.is_empty()
            || input.owner_user_ids.len() > 200
            || input.owner_user_ids.iter().any(|id| *id <= 0)
        {
            return Err(CommerceServiceError::validation(
                "owner_user_ids must contain 1 to 200 positive ids",
            ));
        }
        let mut ids = input.owner_user_ids.clone();
        ids.sort_unstable();
        ids.dedup();
        if ids.len() != input.owner_user_ids.len() {
            return Err(CommerceServiceError::validation(
                "owner_user_ids must be unique",
            ));
        }
        self.repository.create_distribution_task(scope, input).await
    }
    pub async fn list_user_coupons(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionAdminUserCouponItem>, CommerceServiceError> {
        self.repository.list_user_coupons(scope, query).await
    }
    pub async fn list_coupon_ledger(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionCouponLedgerItem>, CommerceServiceError> {
        self.repository.list_coupon_ledger(scope, query).await
    }
    pub async fn list_discount_applications(
        &self,
        scope: &PromotionAdminScope,
        query: &PromotionAdminListQuery,
    ) -> Result<PromotionAdminPage<PromotionDiscountApplicationItem>, CommerceServiceError> {
        self.repository
            .list_discount_applications(scope, query)
            .await
    }
}

fn validate_campaign(input: &PromotionCampaignInput) -> Result<(), CommerceServiceError> {
    required("display_name", &input.display_name)?;
    required("starts_at", &input.starts_at)?;
    if !matches!(
        input.status.as_str(),
        "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED" | "ARCHIVED"
    ) {
        return Err(CommerceServiceError::validation("invalid campaign status"));
    }
    Ok(())
}

fn validate_offer(input: &PromotionOfferInput) -> Result<(), CommerceServiceError> {
    required("display_name", &input.display_name)?;
    required("offer_type", &input.offer_type)?;
    required("discount_type", &input.discount_type)?;
    required("discount_value", &input.discount_value)?;
    required("starts_at", &input.starts_at)?;
    binary_status(input.status)
}

fn positive_id(name: &str, value: i64) -> Result<(), CommerceServiceError> {
    if value <= 0 {
        Err(CommerceServiceError::validation(format!(
            "{name} must be positive"
        )))
    } else {
        Ok(())
    }
}

fn binary_status(status: i32) -> Result<(), CommerceServiceError> {
    if matches!(status, 0 | 1) {
        Ok(())
    } else {
        Err(CommerceServiceError::validation("status must be 0 or 1"))
    }
}

fn required(name: &str, value: &str) -> Result<(), CommerceServiceError> {
    if value.trim().is_empty() {
        Err(CommerceServiceError::validation(format!(
            "{name} is required"
        )))
    } else {
        Ok(())
    }
}

fn optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}
