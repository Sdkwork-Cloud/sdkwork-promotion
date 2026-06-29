use sdkwork_contract_service::{
    CommerceMoney, CommerceServiceError, PromotionCouponStatus,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PromotionDiscount {
    FixedAmount(CommerceMoney),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionOfferDraft {
    pub offer_code: String,
    pub offer_no: String,
    pub offer_type: String,
    pub tenant_id: String,
    pub name: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionOfferVersionDraft {
    pub discount: PromotionDiscount,
    pub offer_id: String,
    pub tenant_id: String,
    pub version_no: i32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionUserCouponTransition {
    from: PromotionCouponStatus,
    to: PromotionCouponStatus,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionUserCouponClaimDraft {
    pub idempotency_key: String,
    pub offer_id: String,
    pub subject_id: String,
    pub subject_type: String,
    pub tenant_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionDiscountApplicationDraft {
    pub idempotency_key: String,
    pub order_id: String,
    pub subject_id: String,
    pub subject_type: String,
    pub tenant_id: String,
    pub user_coupon_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionUserCouponItem {
    pub id: String,
    pub code: String,
    pub amount: CommerceMoney,
    pub date: String,
    pub status: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PointsBalance {
    pub available_points: i64,
    pub frozen_points: i64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PointsHistoryItem {
    pub id: String,
    pub amount: i64,
    pub direction: String,
    pub balance_after: i64,
    pub business_type: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppCommerceExchangeRuleItem {
    pub id: String,
    pub rate: String,
    pub source_asset_type: String,
    pub status: String,
    pub target_asset_type: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCodeRedemptionOutcome {
    pub message: String,
    pub amount: CommerceMoney,
    pub credited_points: i64,
    pub balance: i64,
}

impl PromotionDiscount {
    pub fn fixed_amount(amount: CommerceMoney) -> Result<Self, CommerceServiceError> {
        if amount.as_str() == "0" || amount.as_str() == "0.0" || amount.as_str() == "0.00" {
            return Err(CommerceServiceError::validation(
                "promotion fixed discount must be greater than zero",
            ));
        }

        Ok(Self::FixedAmount(amount))
    }
}

impl PromotionOfferDraft {
    pub fn new(
        tenant_id: &str,
        offer_no: &str,
        offer_code: &str,
        name: &str,
        offer_type: &str,
    ) -> Result<Self, CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("offer_no", offer_no)?;
        crate::validation::require_non_empty("offer_code", offer_code)?;
        crate::validation::require_non_empty("name", name)?;
        crate::validation::require_non_empty("offer_type", offer_type)?;

        Ok(Self {
            offer_code: offer_code.trim().to_string(),
            offer_no: offer_no.trim().to_string(),
            offer_type: offer_type.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
            name: name.trim().to_string(),
        })
    }
}

impl PromotionOfferVersionDraft {
    pub fn new(
        tenant_id: &str,
        offer_id: &str,
        version_no: i32,
        discount: PromotionDiscount,
    ) -> Result<Self, CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("offer_id", offer_id)?;
        if version_no <= 0 {
            return Err(CommerceServiceError::validation(
                "promotion offer version_no must be greater than zero",
            ));
        }

        Ok(Self {
            discount,
            offer_id: offer_id.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
            version_no,
        })
    }
}

impl PromotionUserCouponTransition {
    pub fn new(from: PromotionCouponStatus, to: PromotionCouponStatus) -> Self {
        Self { from, to }
    }

    pub fn validate(&self) -> Result<(), CommerceServiceError> {
        match (&self.from, &self.to) {
            (PromotionCouponStatus::Draft, PromotionCouponStatus::Active)
            | (PromotionCouponStatus::Active, PromotionCouponStatus::Redeemed)
            | (PromotionCouponStatus::Active, PromotionCouponStatus::Expired)
            | (PromotionCouponStatus::Active, PromotionCouponStatus::Disabled)
            | (PromotionCouponStatus::Draft, PromotionCouponStatus::Disabled) => Ok(()),
            _ => Err(CommerceServiceError::invalid_state(
                "invalid promotion user coupon status transition",
            )),
        }
    }
}

impl PromotionUserCouponClaimDraft {
    pub fn new(
        tenant_id: &str,
        offer_id: &str,
        subject_type: &str,
        subject_id: &str,
        idempotency_key: &str,
    ) -> Result<Self, CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("offer_id", offer_id)?;
        crate::validation::require_non_empty("subject_type", subject_type)?;
        crate::validation::require_non_empty("subject_id", subject_id)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            offer_id: offer_id.trim().to_string(),
            subject_id: subject_id.trim().to_string(),
            subject_type: subject_type.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

impl PromotionDiscountApplicationDraft {
    pub fn new(
        tenant_id: &str,
        user_coupon_id: &str,
        order_id: &str,
        subject_type: &str,
        subject_id: &str,
        idempotency_key: &str,
    ) -> Result<Self, CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("user_coupon_id", user_coupon_id)?;
        crate::validation::require_non_empty("order_id", order_id)?;
        crate::validation::require_non_empty("subject_type", subject_type)?;
        crate::validation::require_non_empty("subject_id", subject_id)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            order_id: order_id.trim().to_string(),
            subject_id: subject_id.trim().to_string(),
            subject_type: subject_type.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
            user_coupon_id: user_coupon_id.trim().to_string(),
        })
    }
}

impl PromotionUserCouponItem {
    pub fn new(
        id: &str,
        code: &str,
        amount: &str,
        date: &str,
        status: &str,
    ) -> Result<Self, CommerceServiceError> {
        require_non_empty_service("id", id)?;
        require_non_empty_service("code", code)?;
        require_non_empty_service("date", date)?;
        require_non_empty_service("status", status)?;

        Ok(Self {
            id: id.to_string(),
            code: code.to_string(),
            amount: CommerceMoney::new(amount).map_err(CommerceServiceError::validation)?,
            date: date.to_string(),
            status: status.to_string(),
        })
    }
}

impl PointsBalance {
    pub fn new(available_points: i64, frozen_points: i64) -> Result<Self, CommerceServiceError> {
        if available_points < 0 || frozen_points < 0 {
            return Err(CommerceServiceError::validation(
                "points balance must not be negative",
            ));
        }

        Ok(Self {
            available_points,
            frozen_points,
        })
    }
}

impl PointsHistoryItem {
    pub fn new(
        id: &str,
        amount: i64,
        direction: &str,
        balance_after: i64,
        business_type: &str,
        created_at: &str,
    ) -> Result<Self, CommerceServiceError> {
        require_non_empty_service("id", id)?;
        require_non_empty_service("direction", direction)?;
        require_non_empty_service("business_type", business_type)?;
        require_non_empty_service("created_at", created_at)?;
        if amount < 0 || balance_after < 0 {
            return Err(CommerceServiceError::validation(
                "points history amounts must not be negative",
            ));
        }

        Ok(Self {
            id: id.to_string(),
            amount,
            direction: direction.to_string(),
            balance_after,
            business_type: business_type.to_string(),
            created_at: created_at.to_string(),
        })
    }
}

impl AppCommerceExchangeRuleItem {
    pub fn new(
        id: &str,
        source_asset_type: &str,
        target_asset_type: &str,
        rate: &str,
        status: &str,
    ) -> Result<Self, CommerceServiceError> {
        require_non_empty_service("id", id)?;
        require_non_empty_service("source_asset_type", source_asset_type)?;
        require_non_empty_service("target_asset_type", target_asset_type)?;
        require_non_empty_service("rate", rate)?;
        require_non_empty_service("status", status)?;

        Ok(Self {
            id: id.to_string(),
            rate: rate.to_string(),
            source_asset_type: source_asset_type.to_string(),
            status: status.to_string(),
            target_asset_type: target_asset_type.to_string(),
        })
    }
}

impl PromotionCodeRedemptionOutcome {
    pub fn new(
        message: &str,
        amount: &str,
        credited_points: i64,
        balance: i64,
    ) -> Result<Self, CommerceServiceError> {
        require_non_empty_service("message", message)?;
        if credited_points < 0 || balance < 0 {
            return Err(CommerceServiceError::validation(
                "promotion code redemption outcome points must not be negative",
            ));
        }

        Ok(Self {
            message: message.to_string(),
            amount: CommerceMoney::new(amount).map_err(CommerceServiceError::validation)?,
            credited_points,
            balance,
        })
    }
}

fn require_non_empty_service(field_name: &str, value: &str) -> Result<(), CommerceServiceError> {
    crate::validation::require_non_empty(field_name, value)
}
