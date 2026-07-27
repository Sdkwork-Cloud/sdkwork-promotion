use sdkwork_commerce_promotion_service::{
    PromotionCouponBenefit, PromotionOrderCouponBenefit, PromotionSubscriptionPeriod,
};
use sdkwork_contract_service::CommerceServiceError;
use serde_json::Value;

pub(crate) fn parse_order_coupon_benefit(
    rule_json: Option<&str>,
    legacy_discount_value: &str,
    legacy_currency_code: &str,
    replayed: bool,
) -> Result<PromotionOrderCouponBenefit, CommerceServiceError> {
    let Some(rule_json) = rule_json.map(str::trim).filter(|value| !value.is_empty()) else {
        return legacy_token_bank_benefit(legacy_discount_value, legacy_currency_code, replayed);
    };
    let root = parse_rule_json(rule_json)?;
    let benefit = root
        .get("couponBenefit")
        .or_else(|| root.get("benefit"))
        .unwrap_or(&root);
    let Some(kind) = benefit.get("kind").and_then(Value::as_str) else {
        return legacy_token_bank_benefit(legacy_discount_value, legacy_currency_code, replayed);
    };

    match kind.trim().to_ascii_lowercase().as_str() {
        "token_bank_credit" => {
            let grant_units = positive_integer(benefit, "grantAmount")?;
            let target_asset =
                optional_text(benefit, "targetAsset").unwrap_or_else(|| "token_bank".to_owned());
            if target_asset != "token_bank" {
                return Err(CommerceServiceError::validation(
                    "Token Bank coupon targetAsset must be token_bank",
                ));
            }
            PromotionOrderCouponBenefit::new(grant_units, legacy_currency_code, replayed)
        }
        "subscription" => {
            let product_id = required_text(benefit, "productId")?;
            let sku_id = required_text(benefit, "skuId")?;
            let package_id = positive_integer(benefit, "packageId")?;
            let period = PromotionSubscriptionPeriod::parse(&required_text(benefit, "period")?)?;
            let duration_days = positive_integer(benefit, "durationDays")?;
            PromotionOrderCouponBenefit::subscription(
                &product_id,
                &sku_id,
                package_id,
                period,
                duration_days,
                positive_integer(benefit, "dailyQuota")?,
                positive_integer(benefit, "totalQuota")?,
                replayed,
            )
        }
        _ => Err(CommerceServiceError::validation(
            "promotion coupon benefit kind must be token_bank_credit or subscription",
        )),
    }
}

pub(crate) fn parse_admin_coupon_benefit(
    rule_json: Option<&str>,
) -> Result<Option<PromotionCouponBenefit>, CommerceServiceError> {
    let Some(rule_json) = rule_json.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(None);
    };
    let root = parse_rule_json(rule_json)?;
    let Some(benefit) = root.get("couponBenefit").or_else(|| root.get("benefit")) else {
        return Ok(None);
    };
    let kind = required_text(benefit, "kind")?;
    match kind.trim().to_ascii_lowercase().as_str() {
        "token_bank_credit" => Ok(Some(PromotionCouponBenefit::token_bank_credit(
            positive_integer(benefit, "grantAmount")?,
        )?)),
        "subscription" => Ok(Some(PromotionCouponBenefit::subscription(
            &required_text(benefit, "productId")?,
            &required_text(benefit, "skuId")?,
            positive_integer(benefit, "packageId")?,
            PromotionSubscriptionPeriod::parse(&required_text(benefit, "period")?)?,
            positive_integer(benefit, "durationDays")?,
            positive_integer(benefit, "dailyQuota")?,
            positive_integer(benefit, "totalQuota")?,
        )?)),
        _ => Err(CommerceServiceError::validation(
            "promotion coupon benefit kind must be token_bank_credit or subscription",
        )),
    }
}

pub(crate) fn serialize_admin_coupon_benefit(
    benefit: Option<&PromotionCouponBenefit>,
) -> Result<Option<String>, CommerceServiceError> {
    let Some(benefit) = benefit else {
        return Ok(None);
    };
    benefit.validate()?;
    let coupon_benefit = match benefit {
        PromotionCouponBenefit::TokenBankCredit { grant_amount } => serde_json::json!({
            "kind": "token_bank_credit",
            "targetAsset": "token_bank",
            "grantAmount": grant_amount.to_string(),
        }),
        PromotionCouponBenefit::Subscription {
            product_id,
            sku_id,
            package_id,
            period,
            duration_days,
            daily_quota,
            total_quota,
        } => serde_json::json!({
            "kind": "subscription",
            "productId": product_id,
            "skuId": sku_id,
            "packageId": package_id.to_string(),
            "period": period.as_str(),
            "durationDays": duration_days,
            "dailyQuota": daily_quota.to_string(),
            "totalQuota": total_quota.to_string(),
        }),
    };
    serde_json::to_string(&serde_json::json!({ "couponBenefit": coupon_benefit }))
        .map(Some)
        .map_err(|error| {
            CommerceServiceError::storage(format!(
                "failed to serialize promotion coupon benefit: {error}"
            ))
        })
}

fn parse_rule_json(rule_json: &str) -> Result<Value, CommerceServiceError> {
    serde_json::from_str(rule_json).map_err(|error| {
        CommerceServiceError::validation(format!(
            "promotion coupon benefit rule is invalid JSON: {error}"
        ))
    })
}

fn legacy_token_bank_benefit(
    discount_value: &str,
    currency_code: &str,
    replayed: bool,
) -> Result<PromotionOrderCouponBenefit, CommerceServiceError> {
    PromotionOrderCouponBenefit::new(
        legacy_coupon_credit_units(discount_value)?,
        currency_code,
        replayed,
    )
}

fn legacy_coupon_credit_units(value: &str) -> Result<i64, CommerceServiceError> {
    let normalized = value.trim();
    if normalized.is_empty() || normalized.starts_with('-') || normalized.starts_with('+') {
        return Err(CommerceServiceError::validation(
            "legacy coupon discount value must be a non-negative money amount",
        ));
    }
    let mut parts = normalized.split('.');
    let whole = parts.next().unwrap_or_default();
    let fraction = parts.next().unwrap_or_default();
    if parts.next().is_some()
        || whole.is_empty()
        || !whole.chars().all(|character| character.is_ascii_digit())
        || fraction.len() > 2
        || !fraction.chars().all(|character| character.is_ascii_digit())
    {
        return Err(CommerceServiceError::validation(
            "legacy coupon discount value must be a non-negative money amount",
        ));
    }
    let whole_cents = whole
        .parse::<i64>()
        .ok()
        .and_then(|value| value.checked_mul(100))
        .ok_or_else(|| {
            CommerceServiceError::validation(
                "legacy coupon discount value exceeds the supported range",
            )
        })?;
    let fraction_cents = match fraction.len() {
        0 => 0,
        1 => fraction.parse::<i64>().unwrap_or_default() * 10,
        _ => fraction.parse::<i64>().unwrap_or_default(),
    };
    let cents = whole_cents.checked_add(fraction_cents).ok_or_else(|| {
        CommerceServiceError::validation("legacy coupon discount value exceeds the supported range")
    })?;
    if cents <= 0 {
        return Err(CommerceServiceError::validation(
            "coupon grant amount must be greater than zero",
        ));
    }
    Ok((cents / 10).max(1))
}

fn positive_integer(value: &Value, field: &str) -> Result<i64, CommerceServiceError> {
    value
        .get(field)
        .and_then(|raw| {
            raw.as_i64().or_else(|| {
                raw.as_str()
                    .and_then(|text| text.trim().parse::<i64>().ok())
            })
        })
        .filter(|value| *value > 0)
        .ok_or_else(|| {
            CommerceServiceError::validation(format!(
                "promotion coupon benefit {field} must be a positive integer"
            ))
        })
}

fn required_text(value: &Value, field: &str) -> Result<String, CommerceServiceError> {
    optional_text(value, field).ok_or_else(|| {
        CommerceServiceError::validation(format!("promotion coupon benefit {field} is required"))
    })
}

fn optional_text(value: &Value, field: &str) -> Option<String> {
    value
        .get(field)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_commerce_promotion_service::PromotionOrderCouponBenefitKind;

    #[test]
    fn parses_subscription_coupon_with_daily_and_total_quota() {
        let rule = r#"{"couponBenefit":{"kind":"subscription","productId":"membership","skuId":"sku-pro-month","packageId":"1002","period":"month","durationDays":30,"dailyQuota":"1000","totalQuota":"30000"}}"#;
        let benefit = parse_order_coupon_benefit(Some(rule), "0", "CNY", false)
            .expect("subscription benefit");
        assert!(matches!(
            benefit.kind,
            PromotionOrderCouponBenefitKind::Subscription {
                package_id: 1002,
                daily_quota: 1000,
                total_quota: 30000,
                ..
            }
        ));
    }

    #[test]
    fn rejects_daily_coupon_when_total_differs_from_daily_quota() {
        let rule = r#"{"couponBenefit":{"kind":"subscription","productId":"membership","skuId":"sku-day","packageId":1001,"period":"day","durationDays":1,"dailyQuota":100,"totalQuota":200}}"#;
        assert!(parse_order_coupon_benefit(Some(rule), "0", "CNY", false).is_err());
    }

    #[test]
    fn keeps_legacy_empty_rule_as_token_bank_credit() {
        let benefit =
            parse_order_coupon_benefit(Some("{}"), "500.00", "CNY", true).expect("legacy benefit");
        assert!(benefit.replayed);
        assert!(matches!(
            benefit.kind,
            PromotionOrderCouponBenefitKind::TokenBankCredit {
                grant_units: 5000,
                ..
            }
        ));
    }

    #[test]
    fn admin_subscription_benefit_round_trips_through_canonical_rule_json() {
        let benefit = PromotionCouponBenefit::subscription(
            "seed-product-membership",
            "sku-standard-monthly",
            1002,
            PromotionSubscriptionPeriod::Month,
            30,
            1000,
            30000,
        )
        .expect("admin benefit");
        let rule_json = serialize_admin_coupon_benefit(Some(&benefit))
            .expect("serialize benefit")
            .expect("rule json");
        assert_eq!(
            parse_admin_coupon_benefit(Some(&rule_json)).expect("parse benefit"),
            Some(benefit)
        );
    }

    #[test]
    fn admin_parser_preserves_legacy_rule_without_typed_coupon_benefit() {
        assert_eq!(
            parse_admin_coupon_benefit(Some(r#"{"minimumQuantity":2}"#)).expect("legacy rule"),
            None
        );
    }
}
