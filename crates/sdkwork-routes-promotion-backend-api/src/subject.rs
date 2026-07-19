use sdkwork_commerce_promotion_service::PromotionAdminScope;
use sdkwork_iam_context_service::IamAppContext;

pub(crate) fn backend_operator_scope_from_iam(
    context: &IamAppContext,
) -> Result<PromotionAdminScope, String> {
    let tenant_id = context
        .tenant_id
        .trim()
        .parse::<i64>()
        .map_err(|_| "authenticated runtime context tenant_id must be numeric".to_owned())?;
    let organization_id = context
        .organization_id
        .as_deref()
        .unwrap_or("0")
        .trim()
        .parse::<i64>()
        .map_err(|_| "authenticated runtime context organization_id must be numeric".to_owned())?;
    PromotionAdminScope::new(tenant_id, organization_id, context.user_id.clone())
        .map_err(|error| error.message().to_owned())
}
