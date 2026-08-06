#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimPromotionUserCouponCommand {
    pub idempotency_key: String,
    pub offer_id: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub request_no: String,
    pub tenant_id: String,
}

impl ClaimPromotionUserCouponCommand {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        offer_id: &str,
        request_no: &str,
        idempotency_key: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("offer_id", offer_id)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            offer_id: offer_id.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            request_no: request_no.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ApplyPromotionDiscountCommand {
    pub idempotency_key: String,
    pub order_id: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub request_no: String,
    pub tenant_id: String,
    pub user_coupon_id: String,
}

impl ApplyPromotionDiscountCommand {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        order_id: &str,
        user_coupon_id: &str,
        request_no: &str,
        idempotency_key: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("order_id", order_id)?;
        crate::validation::require_non_empty("user_coupon_id", user_coupon_id)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            order_id: order_id.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            request_no: request_no.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
            user_coupon_id: user_coupon_id.trim().to_string(),
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReversePromotionDiscountCommand {
    pub idempotency_key: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub reason: Option<String>,
    pub request_no: String,
    pub tenant_id: String,
    pub user_coupon_id: String,
}

impl ReversePromotionDiscountCommand {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        user_coupon_id: &str,
        request_no: &str,
        idempotency_key: &str,
        reason: Option<&str>,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("user_coupon_id", user_coupon_id)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            reason: reason
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            request_no: request_no.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
            user_coupon_id: user_coupon_id.trim().to_string(),
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionCodeRedemptionCommand {
    pub code: String,
    pub idempotency_key: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub request_no: String,
    pub tenant_id: String,
}

impl PromotionCodeRedemptionCommand {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        code: &str,
        request_no: &str,
        idempotency_key: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("code", code)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;

        Ok(Self {
            code: code.trim().to_string(),
            idempotency_key: idempotency_key.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            request_no: request_no.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

/// 开通会员卡（订阅权益券兑现时创建独立会员卡载体）。
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GrantMemberCardCommand {
    pub idempotency_key: String,
    pub offer_id: String,
    pub offer_version_id: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub period: crate::PromotionSubscriptionPeriod,
    pub duration_days: i64,
    pub daily_quota: i64,
    pub total_quota: i64,
    pub request_no: String,
    /// 可选排期生效时间（ISO）；为空或已到时立即生效。
    pub starts_at: Option<String>,
    pub tenant_id: String,
    pub user_coupon_id: String,
}

impl GrantMemberCardCommand {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        offer_id: &str,
        offer_version_id: &str,
        user_coupon_id: &str,
        period: crate::PromotionSubscriptionPeriod,
        duration_days: i64,
        daily_quota: i64,
        total_quota: i64,
        request_no: &str,
        starts_at: Option<&str>,
        idempotency_key: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("offer_id", offer_id)?;
        crate::validation::require_non_empty("user_coupon_id", user_coupon_id)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;
        crate::PromotionCouponBenefit::subscription(period, duration_days, daily_quota, total_quota)?;

        Ok(Self {
            idempotency_key: idempotency_key.trim().to_string(),
            offer_id: offer_id.trim().to_string(),
            offer_version_id: offer_version_id.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            period,
            duration_days,
            daily_quota,
            total_quota,
            request_no: request_no.trim().to_string(),
            starts_at: starts_at
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            tenant_id: tenant_id.trim().to_string(),
            user_coupon_id: user_coupon_id.trim().to_string(),
        })
    }
}

/// 消耗会员卡额度（校验每日限额与总额度，幂等）。
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConsumeMemberCardCommand {
    pub amount: i64,
    pub card_id: String,
    pub idempotency_key: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub request_no: String,
    pub source_id: Option<String>,
    pub source_type: Option<String>,
    pub tenant_id: String,
}

impl ConsumeMemberCardCommand {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        card_id: &str,
        amount: i64,
        source_type: Option<&str>,
        source_id: Option<&str>,
        request_no: &str,
        idempotency_key: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("card_id", card_id)?;
        crate::validation::require_non_empty("request_no", request_no)?;
        crate::validation::require_non_empty("idempotency_key", idempotency_key)?;
        if amount <= 0 {
            return Err(sdkwork_contract_service::CommerceServiceError::validation(
                "member card consumption amount must be greater than zero",
            ));
        }

        Ok(Self {
            amount,
            card_id: card_id.trim().to_string(),
            idempotency_key: idempotency_key.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            request_no: request_no.trim().to_string(),
            source_id: source_id.map(str::trim).filter(|value| !value.is_empty()).map(str::to_string),
            source_type: source_type.map(str::trim).filter(|value| !value.is_empty()).map(str::to_string),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::PromotionSubscriptionPeriod;

    #[test]
    fn grant_member_card_command_validates_quota_contract() {
        assert!(GrantMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "offer-1",
            "offer-version-1",
            "coupon-1",
            PromotionSubscriptionPeriod::Month,
            30,
            1000,
            30000,
            "req-1",
            None,
            "idem-1",
        )
        .is_ok());
        // 总额度超过每日额度 × 天数
        assert!(GrantMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "offer-1",
            "offer-version-1",
            "coupon-1",
            PromotionSubscriptionPeriod::Month,
            30,
            1000,
            40000,
            "req-1",
            None,
            "idem-1",
        )
        .is_err());
        // 每日额度为 0
        assert!(GrantMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "offer-1",
            "offer-version-1",
            "coupon-1",
            PromotionSubscriptionPeriod::Day,
            1,
            0,
            0,
            "req-1",
            None,
            "idem-1",
        )
        .is_err());
    }

    #[test]
    fn grant_member_card_command_accepts_optional_scheduled_start() {
        let command = GrantMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "offer-1",
            "offer-version-1",
            "coupon-1",
            PromotionSubscriptionPeriod::Month,
            30,
            1000,
            30000,
            "req-1",
            Some("2026-10-01T00:00:00Z"),
            "idem-1",
        )
        .expect("scheduled grant");
        assert_eq!(
            command.starts_at.as_deref(),
            Some("2026-10-01T00:00:00Z")
        );
        let immediate = GrantMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "offer-1",
            "offer-version-1",
            "coupon-1",
            PromotionSubscriptionPeriod::Month,
            30,
            1000,
            30000,
            "req-1",
            None,
            "idem-2",
        )
        .expect("immediate grant");
        assert_eq!(immediate.starts_at, None);
    }

    #[test]
    fn consume_member_card_command_rejects_non_positive_amount() {
        assert!(ConsumeMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "card-1",
            0,
            None,
            None,
            "req-1",
            "idem-1",
        )
        .is_err());
        assert!(ConsumeMemberCardCommand::new(
            "tenant-1",
            None,
            "user-1",
            "card-1",
            100,
            Some("storage"),
            Some("bucket-1"),
            "req-1",
            "idem-1",
        )
        .is_ok());
    }
}
