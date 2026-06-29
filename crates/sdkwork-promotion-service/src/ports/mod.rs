use crate::{
    PointsBalance, PointsBalanceQuery, PointsHistoryItem, PointsHistoryQuery,
    PromotionCodeRedemptionCommand, PromotionCodeRedemptionOutcome,
    PromotionDiscountApplicationDraft, PromotionUserCouponClaimDraft, PromotionUserCouponItem,
    PromotionUserCouponListQuery,
};
use sdkwork_contract_service::CommerceServiceError;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PromotionRepositoryCommand {
    CreateOffer,
    CreateOfferVersion,
    ClaimUserCoupon,
    ApplyDiscount,
    ReverseDiscountApplication,
    ExpireUserCoupon,
}

pub struct PromotionPortRequirement;

pub trait PromotionRepositoryPort {
    fn claim_user_coupon(
        &self,
        draft: &PromotionUserCouponClaimDraft,
    ) -> Result<(), CommerceServiceError>;

    fn apply_discount(
        &self,
        draft: &PromotionDiscountApplicationDraft,
    ) -> Result<(), CommerceServiceError>;
}

pub trait PromotionApplicationPort {
    fn list_promotion_user_coupons(
        &self,
        query: PromotionUserCouponListQuery,
    ) -> Result<Vec<PromotionUserCouponItem>, CommerceServiceError>;

    fn retrieve_points_balance(
        &self,
        query: PointsBalanceQuery,
    ) -> Result<PointsBalance, CommerceServiceError>;

    fn list_points_history(
        &self,
        query: PointsHistoryQuery,
    ) -> Result<Vec<PointsHistoryItem>, CommerceServiceError>;

    fn redeem_promotion_code(
        &self,
        command: PromotionCodeRedemptionCommand,
    ) -> Result<PromotionCodeRedemptionOutcome, CommerceServiceError>;
}

pub const PROMOTION_REPOSITORY_PORT: &str = "promotion.repository";
pub const PROMOTION_APPLICATION_PORT: &str = "promotion.application";
pub const IDEMPOTENCY_REPOSITORY_PORT: &str = "idempotency.repository";

impl PromotionPortRequirement {
    pub fn standard_commands() -> Vec<PromotionRepositoryCommand> {
        vec![
            PromotionRepositoryCommand::CreateOffer,
            PromotionRepositoryCommand::CreateOfferVersion,
            PromotionRepositoryCommand::ClaimUserCoupon,
            PromotionRepositoryCommand::ApplyDiscount,
            PromotionRepositoryCommand::ReverseDiscountApplication,
            PromotionRepositoryCommand::ExpireUserCoupon,
        ]
    }
}
