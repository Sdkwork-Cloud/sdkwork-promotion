#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionUserCouponListQuery {
    pub owner_user_id: String,
    pub organization_id: Option<String>,
    pub status: Option<String>,
    pub tenant_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PromotionUserCouponDetailQuery {
    pub tenant_id: String,
    pub user_coupon_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PointsBalanceQuery {
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub tenant_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PointsHistoryQuery {
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub tenant_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppCommerceSubject {
    pub organization_id: Option<String>,
    pub tenant_id: String,
    pub user_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AppCommerceExchangeRuleQuery {
    pub source_asset_type: Option<String>,
    pub subject: Option<AppCommerceSubject>,
    pub target_asset_type: Option<String>,
}

impl PromotionUserCouponListQuery {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        status: Option<&str>,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;

        Ok(Self {
            owner_user_id: owner_user_id.trim().to_string(),
            organization_id: optional_text(organization_id),
            status: optional_text(status),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

impl PointsBalanceQuery {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;

        Ok(Self {
            organization_id: optional_text(organization_id),
            owner_user_id: owner_user_id.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

impl PointsHistoryQuery {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;

        Ok(Self {
            organization_id: optional_text(organization_id),
            owner_user_id: owner_user_id.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

impl AppCommerceSubject {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        user_id: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("user_id", user_id)?;

        Ok(Self {
            organization_id: optional_text(organization_id),
            tenant_id: tenant_id.trim().to_string(),
            user_id: user_id.trim().to_string(),
        })
    }
}

fn optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberCardListQuery {
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub tenant_id: String,
}

impl MemberCardListQuery {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        Ok(Self {
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RetrieveMemberCardQuery {
    pub card_id: String,
    pub organization_id: Option<String>,
    pub owner_user_id: String,
    pub tenant_id: String,
}

impl RetrieveMemberCardQuery {
    pub fn new(
        tenant_id: &str,
        organization_id: Option<&str>,
        owner_user_id: &str,
        card_id: &str,
    ) -> Result<Self, sdkwork_contract_service::CommerceServiceError> {
        crate::validation::require_non_empty("tenant_id", tenant_id)?;
        crate::validation::require_non_empty("owner_user_id", owner_user_id)?;
        crate::validation::require_non_empty("card_id", card_id)?;
        Ok(Self {
            card_id: card_id.trim().to_string(),
            organization_id: organization_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            owner_user_id: owner_user_id.trim().to_string(),
            tenant_id: tenant_id.trim().to_string(),
        })
    }
}
