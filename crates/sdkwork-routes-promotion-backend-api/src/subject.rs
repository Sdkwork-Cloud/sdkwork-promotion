use sdkwork_iam_context_service::IamAppContext;

#[derive(Debug, Clone)]
pub(crate) struct BackendOperatorScope {
    pub tenant_id: i64,
    pub organization_id: i64,
}

pub(crate) fn backend_operator_scope_from_iam(
    context: &IamAppContext,
) -> Result<BackendOperatorScope, String> {
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
    if context.user_id.trim().is_empty() {
        return Err("authenticated runtime context user_id is required".to_owned());
    }
    Ok(BackendOperatorScope {
        tenant_id,
        organization_id,
    })
}
