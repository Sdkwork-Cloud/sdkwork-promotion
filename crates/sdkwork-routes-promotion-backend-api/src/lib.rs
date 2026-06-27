pub mod routes;
pub mod web_bootstrap;

pub use routes::build_promotion_backend_router_with_framework;

use axum::Router;
use sdkwork_promotion_service_host::PromotionServiceHost;
use std::sync::Arc;

pub async fn gateway_mount(host: Arc<PromotionServiceHost>) -> Router {
    build_promotion_backend_router_with_framework(host).await
}
