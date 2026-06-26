use axum::routing::get;
use axum::Router;
use std::sync::Arc;
use sdkwork_promotion_service_host::PromotionServiceHost;

pub fn build_promotion_backend_router(_host: Arc<PromotionServiceHost>) -> Router {
    Router::new().route(
        "/backend/v3/api/coupons/health",
        get(|| async { "ok" }),
    )
}

pub async fn build_promotion_backend_router_with_framework(host: Arc<PromotionServiceHost>) -> Router {
    build_promotion_backend_router(host)
}
