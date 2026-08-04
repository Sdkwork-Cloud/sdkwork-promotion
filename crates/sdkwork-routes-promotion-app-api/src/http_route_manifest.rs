use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const HTTP_ROUTES: &[HttpRoute] = &[
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/user_coupons",
        "userCoupons.list",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/user_coupons/{userCouponId}",
        "userCoupons.retrieve",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/user_coupons/wallet",
        "userCoupons.wallet.list",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/user_coupons/wallet/{userCouponId}",
        "userCoupons.wallet.retrieve",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/offers",
        "offers.list",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/promotions/offers/{offerId}",
        "offers.retrieve",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/wallet/points",
        "points.balance",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/wallet/points/history",
        "points.history",
    ),
    public(
        HttpMethod::Post,
        "/app/v3/api/promotions/user_coupon_claims",
        "userCoupons.claim",
    ),
    public(
        HttpMethod::Post,
        "/app/v3/api/promotions/codes/redemptions",
        "codes.redeem",
    ),
    public(
        HttpMethod::Post,
        "/app/v3/api/promotions/discount_applications",
        "discountApplications.apply",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/wallet/exchange_rate",
        "wallet.exchangeRate",
    ),
    public(
        HttpMethod::Get,
        "/app/v3/api/wallet/points/exchanges/rules",
        "points.exchangeRules",
    ),
];

const fn public(method: HttpMethod, path: &'static str, operation_id: &'static str) -> HttpRoute {
    HttpRoute::public(method, path, "promotions", operation_id)
}

pub fn app_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
