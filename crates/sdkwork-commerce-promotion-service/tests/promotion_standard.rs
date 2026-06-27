use sdkwork_commerce_contract_service::{
    CommerceMoney, CommerceServiceError, PromotionCouponStatus,
};
use sdkwork_commerce_promotion_service::{
    PromotionDiscount, PromotionDiscountApplicationDraft, PromotionOfferDraft,
    PromotionOfferVersionDraft, PromotionPortRequirement, PromotionRepositoryCommand,
    PromotionUserCouponClaimDraft, PromotionUserCouponTransition,
};

#[test]
fn validates_promotion_offer_and_version_for_local_private_runtime() {
    let discount = PromotionDiscount::fixed_amount(CommerceMoney::new("10.00").unwrap()).unwrap();
    let offer = PromotionOfferDraft::new(
        "100001",
        "offer-new-user",
        "new_user_coupon",
        "New user coupon",
        "coupon",
    )
    .unwrap();
    let version = PromotionOfferVersionDraft::new("100001", "offer-1", 1, discount).unwrap();

    assert_eq!(offer.tenant_id, "100001");
    assert_eq!(offer.offer_no, "offer-new-user");
    assert_eq!(offer.offer_code, "new_user_coupon");
    assert_eq!(offer.name, "New user coupon");
    assert_eq!(offer.offer_type, "coupon");
    assert_eq!(version.offer_id, "offer-1");
    assert_eq!(version.version_no, 1);
    assert!(PromotionOfferDraft::new(
        "100001",
        "",
        "new_user_coupon",
        "New user coupon",
        "coupon",
    )
    .is_err());
}

#[test]
fn validates_promotion_user_coupon_status_lifecycle() {
    assert_eq!(
        PromotionUserCouponTransition::new(
            PromotionCouponStatus::Draft,
            PromotionCouponStatus::Active
        )
        .validate(),
        Ok(())
    );
    assert_eq!(
        PromotionUserCouponTransition::new(
            PromotionCouponStatus::Active,
            PromotionCouponStatus::Redeemed
        )
        .validate(),
        Ok(()),
    );
    assert_eq!(
        PromotionUserCouponTransition::new(
            PromotionCouponStatus::Redeemed,
            PromotionCouponStatus::Active
        )
        .validate(),
        Err(CommerceServiceError::invalid_state(
            "invalid promotion user coupon status transition"
        )),
    );
}

#[test]
fn user_coupon_claim_and_discount_application_require_subject_and_idempotency() {
    let claim =
        PromotionUserCouponClaimDraft::new("100001", "offer-1", "user", "user-1", "idem-claim-1")
            .unwrap();
    let application = PromotionDiscountApplicationDraft::new(
        "100001",
        "user-coupon-1",
        "order-1",
        "user",
        "user-1",
        "idem-apply-1",
    )
    .unwrap();

    assert_eq!(claim.subject_id, "user-1");
    assert_eq!(application.order_id, "order-1");
    assert!(
        PromotionUserCouponClaimDraft::new("100001", "offer-1", "user", "", "idem-claim-1")
            .is_err()
    );
    assert!(PromotionDiscountApplicationDraft::new(
        "100001",
        "user-coupon-1",
        "order-1",
        "user",
        "user-1",
        ""
    )
    .is_err());
}

#[test]
fn promotion_repository_contract_exposes_required_commands() {
    assert_eq!(
        PromotionPortRequirement::standard_commands(),
        vec![
            PromotionRepositoryCommand::CreateOffer,
            PromotionRepositoryCommand::CreateOfferVersion,
            PromotionRepositoryCommand::ClaimUserCoupon,
            PromotionRepositoryCommand::ApplyDiscount,
            PromotionRepositoryCommand::ReverseDiscountApplication,
            PromotionRepositoryCommand::ExpireUserCoupon,
        ],
    );
}
