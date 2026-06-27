use sdkwork_commerce_contract_service::CommerceServiceContract;

pub fn promotion_service_contract() -> CommerceServiceContract {
    CommerceServiceContract::new(
        "promotion",
        "commerce.promotion",
        vec![
            "promotions.userCoupons.claims.create",
            "promotions.codes.redemptions.create",
            "promotions.discountApplications.create",
            "promotions.discountApplications.reversals.create",
        ],
        vec![
            "promotions.userCoupons.list",
            "wallet.exchangeRate.retrieve",
            "wallet.points.exchangeRules.list",
            "promotions.offers.list",
            "promotions.couponStocks.list",
            "promotions.codes.list",
            "promotions.discountApplications.list",
            "promotions.discountAllocations.list",
        ],
        vec![
            crate::ports::PROMOTION_APPLICATION_PORT,
            crate::ports::PROMOTION_REPOSITORY_PORT,
            crate::ports::IDEMPOTENCY_REPOSITORY_PORT,
        ],
        true,
    )
}
