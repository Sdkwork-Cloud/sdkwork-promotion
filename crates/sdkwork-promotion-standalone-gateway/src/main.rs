//! sdkwork-promotion 独立部署的 building-block API 服务器。
//!
//! 该二进制仅在 building-block 拓扑下独立运行；生产网关路由由 commerce/app 拓扑拥有。
//! CORS 策略默认拒绝跨域，必须通过 `PROMOTION_CORS_ORIGINS` 环境变量显式配置允许的来源。

use axum::Router;
use http::HeaderValue;
use sdkwork_promotion_gateway_assembly::assemble_application_router;
use sdkwork_promotion_service_host::PromotionServiceHost;
use sdkwork_web_bootstrap::{service_router, ServiceRouterConfig};
use std::sync::Arc;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;

/// 环境变量名：允许的跨域来源列表，逗号分隔。
///
/// 示例：`https://console.sdkwork.com,https://admin.sdkwork.com`。
/// 留空时不附加 CORS 层，等同拒绝所有跨域请求。
const CORS_ORIGINS_ENV: &str = "PROMOTION_CORS_ORIGINS";

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let host = Arc::new(PromotionServiceHost::new().await);
    let business = assemble_application_router(host).await.router;
    let business = business.layer(TraceLayer::new_for_http());
    let business = match cors_layer_from_env() {
        Some(layer) => business.layer(layer),
        None => business,
    };
    let app = service_router(business, ServiceRouterConfig::default().with_always_ready());
    let addr = std::env::var("PROMOTION_API_BIND").unwrap_or_else(|_| "0.0.0.0:18097".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|error| panic!("promotion-api bind {addr} failed: {error}"));
    tracing::info!(%addr, "promotion api server listening");
    axum::serve(listener, app)
        .await
        .unwrap_or_else(|error| panic!("promotion api serve failed: {error}"));
}

/// 从 `PROMOTION_CORS_ORIGINS` 构建受控 CORS 层。
///
/// 仅允许显式列出的来源，禁止携带任意来源；方法与头部使用最小必要集合。
/// 环境变量缺失或为空时返回 `None`，表示不附加 CORS 层（拒绝所有跨域）。
fn cors_layer_from_env() -> Option<CorsLayer> {
    let raw = std::env::var(CORS_ORIGINS_ENV).ok()?;
    let origins: Vec<HeaderValue> = raw
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .filter_map(|value| match HeaderValue::from_str(value) {
            Ok(header) => Some(header),
            Err(error) => {
                tracing::warn!(origin = %value, %error, "invalid CORS origin skipped");
                None
            }
        })
        .collect();
    if origins.is_empty() {
        return None;
    }
    tracing::info!(
        count = origins.len(),
        "CORS allow-origin list configured"
    );
    Some(
        CorsLayer::new()
            .allow_origin(AllowOrigin::list(origins))
            .allow_methods([
                http::Method::GET,
                http::Method::POST,
                http::Method::PUT,
                http::Method::PATCH,
                http::Method::DELETE,
                http::Method::OPTIONS,
            ])
            .allow_headers([
                http::header::AUTHORIZATION,
                http::header::CONTENT_TYPE,
                http::header::ACCEPT,
            ])
            .allow_credentials(true),
    )
}
