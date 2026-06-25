use axum::Router;
use sdkwork_router_promotion_app_api::build_promotion_app_router_with_framework;
use sdkwork_router_promotion_backend_api::build_promotion_backend_router_with_framework;
use sdkwork_promotion_api_server::promotion_health_router;
use sdkwork_promotion_service_host::PromotionServiceHost;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let host = Arc::new(PromotionServiceHost::new().await);
    let app = Router::new()
        .merge(promotion_health_router())
        .merge(build_promotion_app_router_with_framework(host.clone()).await)
        .merge(build_promotion_backend_router_with_framework(host).await)
        .layer(CorsLayer::permissive());
    let addr = std::env::var("PROMOTION_API_BIND").unwrap_or_else(|_| "0.0.0.0:18097".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}
