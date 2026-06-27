use axum::routing::get;
use axum::Router;
use std::sync::Arc;
use sdkwork_promotion_service_host::PromotionServiceHost;

use crate::web_bootstrap::wrap_router_with_web_framework_from_env;

/// 构建后端管理路由（不含 IAM web framework 层）。
///
/// 仅用于已被 T0 平台 IAM 包装的内部组合场景。独立部署必须使用
/// [`build_promotion_backend_router_with_framework`] 以确保请求上下文解析生效。
pub fn build_promotion_backend_router(_host: Arc<PromotionServiceHost>) -> Router {
    Router::new().route(
        "/backend/v3/api/coupons/health",
        get(|| async { "ok" }),
    )
}

/// 构建后端管理路由并叠加 IAM web framework 层。
///
/// 该函数是 `gateway_mount` 的实际入口，确保所有后端端点都经过请求身份解析，
/// 避免无鉴权暴露。与 `build_promotion_app_router_with_framework` 保持一致。
pub async fn build_promotion_backend_router_with_framework(
    host: Arc<PromotionServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_promotion_backend_router(host)).await
}
