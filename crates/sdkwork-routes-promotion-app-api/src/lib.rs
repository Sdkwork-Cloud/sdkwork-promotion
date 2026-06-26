pub mod command_headers;
pub mod exchange_router;
pub mod promotion_router;
pub mod routes;
pub mod subject;
pub mod web_bootstrap;

pub use exchange_router::{
    app_exchange_router_with_postgres_pool, app_exchange_router_with_sqlite_pool,
    build_app_exchange_router, CommerceExchangeFuture, CommerceExchangeStore,
};
pub use promotion_router::{
    app_promotion_router_with_postgres_pool, app_promotion_router_with_sqlite_pool,
    build_app_promotion_router, CommercePromotionFuture, CommercePromotionStore,
};
pub use routes::build_promotion_app_router_with_framework;
pub use web_bootstrap::wrap_router_with_web_framework_from_env;

use axum::Router;
use sdkwork_promotion_service_host::PromotionServiceHost;
use std::sync::Arc;

pub async fn gateway_mount(host: Arc<PromotionServiceHost>) -> Router {
    build_promotion_app_router_with_framework(host).await
}
