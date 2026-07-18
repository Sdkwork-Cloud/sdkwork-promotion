use axum::Router;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_promotion_service_host::PromotionServiceHost;
use std::sync::Arc;

use crate::operations::{
    backend_promotion_router_with_postgres_pool, backend_promotion_router_with_sqlite_pool,
};
use crate::web_bootstrap::wrap_router_with_web_framework_from_env;

pub fn build_promotion_backend_router(host: Arc<PromotionServiceHost>) -> Router {
    match host.database_pool() {
        DatabasePool::Postgres(pool, _) => {
            backend_promotion_router_with_postgres_pool(pool.clone())
        }
        DatabasePool::Sqlite(pool, _) => backend_promotion_router_with_sqlite_pool(pool.clone()),
    }
}

pub async fn build_promotion_backend_router_with_framework(
    host: Arc<PromotionServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_promotion_backend_router(host)).await
}
