use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const READ_PERMISSION: &str = "commerce.marketing.read";
const MANAGE_PERMISSION: &str = "commerce.marketing.manage";

const HTTP_ROUTES: &[HttpRoute] = &[
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/overview",
        "overview.retrieve",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/campaigns",
        "campaigns.list",
    ),
    manage(
        HttpMethod::Post,
        "/backend/v3/api/promotions/campaigns",
        "campaigns.create",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/campaigns/{campaignId}",
        "campaigns.retrieve",
    ),
    manage(
        HttpMethod::Patch,
        "/backend/v3/api/promotions/campaigns/{campaignId}",
        "campaigns.update",
    ),
    manage(
        HttpMethod::Delete,
        "/backend/v3/api/promotions/campaigns/{campaignId}",
        "campaigns.delete",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/offers",
        "offers.list",
    ),
    manage(
        HttpMethod::Post,
        "/backend/v3/api/promotions/offers",
        "offers.create",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/offers/{offerId}",
        "offers.retrieve",
    ),
    manage(
        HttpMethod::Patch,
        "/backend/v3/api/promotions/offers/{offerId}",
        "offers.update",
    ),
    manage(
        HttpMethod::Delete,
        "/backend/v3/api/promotions/offers/{offerId}",
        "offers.delete",
    ),
    manage(
        HttpMethod::Patch,
        "/backend/v3/api/promotions/offers/{offerId}/status",
        "offers.status.update",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/coupon_stocks",
        "couponStocks.list",
    ),
    manage(
        HttpMethod::Post,
        "/backend/v3/api/promotions/coupon_stocks",
        "couponStocks.create",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/code_batches",
        "codeBatches.list",
    ),
    manage(
        HttpMethod::Post,
        "/backend/v3/api/promotions/code_batches",
        "codeBatches.create",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/codes",
        "codes.list",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/distribution_tasks",
        "distributionTasks.list",
    ),
    manage(
        HttpMethod::Post,
        "/backend/v3/api/promotions/distribution_tasks",
        "distributionTasks.create",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/user_coupons",
        "userCoupons.list",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/coupon_ledger_entries",
        "couponLedgerEntries.list",
    ),
    read(
        HttpMethod::Get,
        "/backend/v3/api/promotions/discount_applications",
        "discountApplications.list",
    ),
];

const fn read(method: HttpMethod, path: &'static str, operation_id: &'static str) -> HttpRoute {
    HttpRoute::dual_token(method, path, "promotions", operation_id)
        .with_required_permission(READ_PERMISSION)
}

const fn manage(method: HttpMethod, path: &'static str, operation_id: &'static str) -> HttpRoute {
    HttpRoute::dual_token(method, path, "promotions", operation_id)
        .with_required_permission(MANAGE_PERMISSION)
}

pub fn backend_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
