use axum::Router;
use sdkwork_promotion_service_host::PromotionServiceHost;
use std::sync::Arc;

use crate::operations::build_backend_promotion_router;
use crate::web_bootstrap::wrap_router_with_web_framework_from_env;

pub fn build_promotion_backend_router(host: Arc<PromotionServiceHost>) -> Router {
    build_backend_promotion_router(host.promotion_admin_service())
}

pub async fn build_promotion_backend_router_with_framework(
    host: Arc<PromotionServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_promotion_backend_router(host)).await
}
