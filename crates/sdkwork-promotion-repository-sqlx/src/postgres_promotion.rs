use std::time::{SystemTime, UNIX_EPOCH};

use sdkwork_contract_service::{
    CommerceAccountAssetType, CommerceLedgerDirection, CommerceServiceError,
};
use sdkwork_promotion_service::{
    ApplyPromotionDiscountCommand, ClaimPromotionUserCouponCommand, PointsBalance,
    PointsBalanceQuery, PointsHistoryItem, PointsHistoryQuery, PromotionCodeRedemptionCommand,
    PromotionCodeRedemptionOutcome, PromotionOrderCouponBenefit, PromotionUserCouponItem,
    PromotionUserCouponListQuery, ReversePromotionDiscountCommand,
};
use sqlx::{PgPool, Postgres, Row, Transaction};

const POINTS_CURRENCY_CODE: &str = "POINT";
const PROMOTION_CODE_REDEMPTION_SCOPE: &str = "promotions.codes.redemptions.create";
const PROMOTION_USER_COUPON_CLAIM_SCOPE: &str = "promotions.userCoupons.claims.create";
const PROMOTION_DISCOUNT_APPLICATION_CREATE_SCOPE: &str = "promotions.discountApplications.create";
const PROMOTION_DISCOUNT_APPLICATION_REVERSAL_SCOPE: &str =
    "promotions.discountApplications.reversals.create";
const USER_SUBJECT_TYPE: &str = "user";
const PROMOTION_USER_COUPON_SOURCE_TYPE: &str = "promotion_user_coupon";

#[derive(Debug, Clone)]
pub struct PostgresCommercePromotionStore {
    pool: PgPool,
}

#[derive(Debug, Clone)]
struct ClaimPromotion {
    stock_id: String,
    offer_id: String,
    offer_version_id: String,
    stock_type: String,
    discount_value: String,
    total_quantity: Option<i64>,
    available_quantity: i64,
    stock_claimed_quantity: i64,
    expires_at: Option<String>,
}

#[derive(Debug, Clone)]
struct RedeemPromotion {
    code_id: String,
    stock_id: String,
    offer_id: String,
    offer_version_id: String,
    stock_type: String,
    discount_value: String,
    currency_code: String,
    total_quantity: Option<i64>,
    available_quantity: i64,
    stock_claimed_quantity: i64,
    code_max_claims: i64,
    code_claimed_quantity: i64,
    expires_at: Option<String>,
}

#[derive(Debug, Clone)]
struct PointsAccount {
    id: String,
    available_points: i64,
}

impl PostgresCommercePromotionStore {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn preview_promotion_code_for_order(
        &self,
        command: PromotionCodeRedemptionCommand,
    ) -> Result<PromotionOrderCouponBenefit, CommerceServiceError> {
        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error("failed to begin promotion order coupon preview", error)
        })?;
        let now = current_timestamp_string();
        let promotion = load_promotion_for_redeem(&mut tx, &command, &now).await?;
        ensure_promotion_can_be_redeemed(&mut tx, &command, &promotion).await?;
        PromotionOrderCouponBenefit::new(
            coupon_credit_points(&promotion.discount_value)?,
            &promotion.currency_code,
            false,
        )
    }

    pub async fn redeem_promotion_code_for_order(
        &self,
        command: PromotionCodeRedemptionCommand,
    ) -> Result<PromotionOrderCouponBenefit, CommerceServiceError> {
        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error("failed to begin promotion order coupon redemption", error)
        })?;
        let coupon_id = coupon_id(&command);
        let replay = sqlx::query(
            r#"
            SELECT pc.promotion_code,
                   CAST(v.discount_value AS TEXT) AS discount_value,
                   COALESCE(v.currency_code, 'CNY') AS currency_code
            FROM promotion_user_coupon c
            JOIN promotion_code pc ON pc.tenant_id = c.tenant_id AND pc.id = c.code_id
            JOIN promotion_offer_version v
              ON v.tenant_id = c.tenant_id AND v.id = c.offer_version_id
            WHERE c.tenant_id = $1
              AND ((c.organization_id = $2) OR (c.organization_id IS NULL AND $2 IS NULL))
              AND c.id = $3
              AND c.subject_type = $4
              AND c.subject_id = $5
            LIMIT 1
            "#,
        )
        .bind(&command.tenant_id)
        .bind(command.organization_id.as_deref())
        .bind(&coupon_id)
        .bind(USER_SUBJECT_TYPE)
        .bind(&command.owner_user_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|error| store_error("failed to replay promotion order coupon", error))?;
        if let Some(row) = replay {
            if string_cell(&row, "promotion_code") != command.code {
                return Err(CommerceServiceError::conflict(
                    "coupon redemption request was replayed with a different code",
                ));
            }
            let benefit = PromotionOrderCouponBenefit::new(
                coupon_credit_points(&string_cell(&row, "discount_value"))?,
                &string_cell(&row, "currency_code"),
                true,
            )?;
            tx.commit().await.map_err(|error| {
                store_error("failed to commit promotion order coupon replay", error)
            })?;
            return Ok(benefit);
        }

        let now = current_timestamp_string();
        let promotion = load_promotion_for_redeem(&mut tx, &command, &now).await?;
        ensure_promotion_can_be_redeemed(&mut tx, &command, &promotion).await?;
        let benefit = PromotionOrderCouponBenefit::new(
            coupon_credit_points(&promotion.discount_value)?,
            &promotion.currency_code,
            false,
        )?;
        let coupon_ledger_entry_id = coupon_ledger_entry_id(&command);
        insert_user_coupon(&mut tx, &command, &promotion, &coupon_id, &now).await?;
        insert_coupon_ledger_entry(
            &mut tx,
            &command,
            &promotion,
            &coupon_id,
            &coupon_ledger_entry_id,
            &now,
        )
        .await?;
        update_promotion_counters(&mut tx, &promotion, &now).await?;
        tx.commit().await.map_err(|error| {
            store_error("failed to commit promotion order coupon redemption", error)
        })?;
        Ok(benefit)
    }

    pub async fn list_promotion_user_coupons(
        &self,
        query: PromotionUserCouponListQuery,
    ) -> Result<Vec<PromotionUserCouponItem>, CommerceServiceError> {
        let rows = sqlx::query(
            r#"
            SELECT c.id,
                   COALESCE(NULLIF(c.coupon_code, ''), '-') AS code,
                   CAST(COALESCE(a.discount_amount, v.discount_value, '0') AS TEXT) AS amount,
                   CAST(COALESCE(a.applied_at, c.redeemed_at, c.claimed_at, c.created_at) AS TEXT) AS date,
                   c.status AS status
            FROM promotion_user_coupon c
            JOIN promotion_offer_version v
              ON v.tenant_id = c.tenant_id
             AND v.id = c.offer_version_id
            LEFT JOIN promotion_discount_application a
              ON a.tenant_id = c.tenant_id
             AND a.user_coupon_id = c.id
             AND a.subject_type = c.subject_type
             AND a.subject_id = c.subject_id
            WHERE c.tenant_id = CAST($1 AS TEXT)
              AND ((c.organization_id = CAST($2 AS TEXT)) OR (c.organization_id IS NULL AND $2 IS NULL))
              AND c.subject_type = $3
              AND c.subject_id = CAST($4 AS TEXT)
              AND ($5 IS NULL OR c.status = $5)
            ORDER BY COALESCE(a.applied_at, c.redeemed_at, c.claimed_at, c.created_at) DESC NULLS LAST, c.id DESC
            "#,
        )
        .bind(&query.tenant_id)
        .bind(query.organization_id.as_deref())
        .bind(USER_SUBJECT_TYPE)
        .bind(&query.owner_user_id)
        .bind(query.status.as_deref())
        .fetch_all(&self.pool)
        .await
        .map_err(|error| store_error("failed to list current user coupons", error))?;

        rows.iter()
            .map(|row| {
                let status = coupon_status_label(&required_status_cell(row, "status", "redeem")?)?
                    .to_owned();
                PromotionUserCouponItem::new(
                    &string_cell(row, "id"),
                    &string_cell(row, "code"),
                    &string_cell(row, "amount"),
                    &string_cell(row, "date"),
                    &status,
                )
            })
            .collect()
    }

    pub async fn retrieve_points_balance(
        &self,
        query: PointsBalanceQuery,
    ) -> Result<PointsBalance, CommerceServiceError> {
        let row = sqlx::query(
            r#"
            SELECT CAST(COALESCE(SUM(CASE WHEN status = 'active' THEN CAST(available_amount AS BIGINT) ELSE 0 END), 0) AS BIGINT) AS available_points,
                   CAST(COALESCE(SUM(CASE WHEN status = 'active' THEN CAST(frozen_amount AS BIGINT) ELSE 0 END), 0) AS BIGINT) AS frozen_points
            FROM commerce_account
            WHERE tenant_id = CAST($1 AS TEXT)
              AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $2 IS NULL))
              AND owner_user_id = CAST($3 AS TEXT)
              AND asset_type = $4
              AND currency_code = $5
            "#,
        )
        .bind(&query.tenant_id)
        .bind(query.organization_id.as_deref())
        .bind(&query.owner_user_id)
        .bind(CommerceAccountAssetType::Points.as_str())
        .bind(POINTS_CURRENCY_CODE)
        .fetch_one(&self.pool)
        .await
        .map_err(|error| store_error("failed to retrieve points balance", error))?;

        PointsBalance::new(
            integer_cell(&row, "available_points"),
            integer_cell(&row, "frozen_points"),
        )
    }

    pub async fn list_points_history(
        &self,
        query: PointsHistoryQuery,
    ) -> Result<Vec<PointsHistoryItem>, CommerceServiceError> {
        let rows = sqlx::query(
            r#"
            SELECT id,
                   CAST(amount AS BIGINT) AS amount,
                   direction,
                   CAST(balance_after AS BIGINT) AS balance_after,
                   business_type,
                   CAST(created_at AS TEXT) AS created_at
            FROM commerce_account_ledger_entry
            WHERE tenant_id = CAST($1 AS TEXT)
              AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $2 IS NULL))
              AND owner_user_id = CAST($3 AS TEXT)
              AND asset_type = $4
            ORDER BY created_at DESC NULLS LAST, id DESC
            "#,
        )
        .bind(&query.tenant_id)
        .bind(query.organization_id.as_deref())
        .bind(&query.owner_user_id)
        .bind(CommerceAccountAssetType::Points.as_str())
        .fetch_all(&self.pool)
        .await
        .map_err(|error| store_error("failed to list points history", error))?;

        rows.iter()
            .map(|row| {
                let amount = integer_cell(row, "amount").max(0);
                PointsHistoryItem::new(
                    &string_cell(row, "id"),
                    amount,
                    points_direction(&string_cell(row, "direction")),
                    integer_cell(row, "balance_after").max(0),
                    points_business_type(&string_cell(row, "business_type")),
                    &string_cell(row, "created_at"),
                )
            })
            .collect()
    }

    pub async fn redeem_promotion_code(
        &self,
        command: PromotionCodeRedemptionCommand,
    ) -> Result<PromotionCodeRedemptionOutcome, CommerceServiceError> {
        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error(
                "failed to begin promotion code redemption transaction",
                error,
            )
        })?;
        let now = current_timestamp_string();
        let request_hash = redeem_request_hash(&command);
        if let Some(row) = load_redeem_idempotency_row(&mut tx, &command).await? {
            if string_cell(&row, "request_hash") != request_hash {
                return Err(CommerceServiceError::conflict(
                    "idempotency key was used with a different promotion code redemption request",
                ));
            }
            if string_cell(&row, "status") == "completed" {
                let outcome = replay_redeem_outcome(&row)?;
                tx.commit().await.map_err(|error| {
                    store_error("failed to commit promotion code redemption replay", error)
                })?;
                return Ok(outcome);
            }
            // 锁仍有效：另一个请求正在执行，拒绝并发抢占
            let locked_until = string_cell(&row, "locked_until");
            if !locked_until.is_empty() && locked_until > now {
                return Err(CommerceServiceError::conflict(
                    "another promotion code redemption request is in progress for this idempotency key",
                ));
            }
            // 锁已过期：前序请求崩溃残留，抢占并继续执行
            refresh_redeem_idempotency_lock(&mut tx, &command, &now).await?;
        } else {
            insert_redeem_idempotency_lock(&mut tx, &command, &request_hash, &now).await?;
        }

        let promotion = load_promotion_for_redeem(&mut tx, &command, &now).await?;
        ensure_promotion_can_be_redeemed(&mut tx, &command, &promotion).await?;
        let account = ensure_points_account(&mut tx, &command, &now).await?;
        let credited_points = coupon_credit_points(&promotion.discount_value)?;
        let balance_after = checked_points_add(account.available_points, credited_points)?;
        let coupon_id = coupon_id(&command);
        let coupon_ledger_entry_id = coupon_ledger_entry_id(&command);

        insert_user_coupon(&mut tx, &command, &promotion, &coupon_id, &now).await?;
        insert_coupon_ledger_entry(
            &mut tx,
            &command,
            &promotion,
            &coupon_id,
            &coupon_ledger_entry_id,
            &now,
        )
        .await?;
        update_promotion_counters(&mut tx, &promotion, &now).await?;
        update_account_points(
            &mut tx,
            &account.id,
            account.available_points,
            credited_points,
            &now,
        )
        .await?;
        insert_account_ledger(
            &mut tx,
            &command,
            &account.id,
            balance_after,
            credited_points,
            &coupon_id,
            &now,
        )
        .await?;
        insert_redeem_billing_history(
            &mut tx,
            &command,
            &coupon_id,
            &points_to_money_string(credited_points),
            &promotion.currency_code,
            credited_points,
            &now,
        )
        .await?;
        let outcome = PromotionCodeRedemptionOutcome::new(
            "Promotion code redeemed",
            &points_to_money_string(credited_points),
            credited_points,
            balance_after,
        )?;
        complete_redeem_idempotency(&mut tx, &command, &outcome, &now).await?;

        tx.commit().await.map_err(|error| {
            store_error(
                "failed to commit promotion code redemption transaction",
                error,
            )
        })?;

        Ok(outcome)
    }
    pub async fn claim_promotion_user_coupon(
        &self,
        command: ClaimPromotionUserCouponCommand,
    ) -> Result<PromotionUserCouponItem, CommerceServiceError> {
        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error(
                "failed to begin promotion user coupon claim transaction",
                error,
            )
        })?;
        let now = current_timestamp_string();
        let request_hash = claim_request_hash(&command);
        if let Some(row) = load_claim_idempotency_row(&mut tx, &command).await? {
            if string_cell(&row, "request_hash") != request_hash {
                return Err(CommerceServiceError::conflict(
                    "idempotency key was used with a different promotion coupon claim request",
                ));
            }
            if string_cell(&row, "status") == "completed" {
                let coupon = replay_claim_coupon(&row)?;
                tx.commit().await.map_err(|error| {
                    store_error("failed to commit promotion coupon claim replay", error)
                })?;
                return Ok(coupon);
            }
            // 锁仍有效：另一个请求正在执行，拒绝并发抢占
            let locked_until = string_cell(&row, "locked_until");
            if !locked_until.is_empty() && locked_until > now {
                return Err(CommerceServiceError::conflict(
                    "another promotion coupon claim request is in progress for this idempotency key",
                ));
            }
            // 锁已过期：前序请求崩溃残留，抢占并继续执行
            refresh_claim_idempotency_lock(&mut tx, &command, &now).await?;
        } else {
            insert_claim_idempotency_lock(&mut tx, &command, &request_hash, &now).await?;
        }

        let promotion = load_promotion_for_claim(&mut tx, &command, &now).await?;
        ensure_promotion_offer_can_be_claimed(&mut tx, &command, &promotion).await?;
        let coupon_id = claim_coupon_id(&command);
        insert_claimed_user_coupon(&mut tx, &command, &promotion, &coupon_id, &now).await?;
        insert_claim_coupon_ledger_entry(
            &mut tx,
            &command,
            &promotion,
            &coupon_id,
            &claim_coupon_ledger_entry_id(&command),
            &now,
        )
        .await?;
        update_claim_promotion_counters(&mut tx, &promotion, &now).await?;

        let coupon = PromotionUserCouponItem::new(
            &coupon_id,
            &issued_claim_coupon_code(&command),
            &promotion.discount_value,
            &now,
            "pending",
        )?;
        complete_claim_idempotency(&mut tx, &command, &coupon, &now).await?;
        tx.commit().await.map_err(|error| {
            store_error(
                "failed to commit promotion user coupon claim transaction",
                error,
            )
        })?;
        Ok(coupon)
    }

    pub async fn apply_promotion_discount(
        &self,
        command: ApplyPromotionDiscountCommand,
    ) -> Result<PromotionUserCouponItem, CommerceServiceError> {
        if let Some(existing) = self.find_applied_promotion_coupon(&command).await? {
            return Ok(existing);
        }

        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error(
                "failed to begin promotion discount application transaction",
                error,
            )
        })?;
        let now = current_timestamp_string();
        let request_hash = apply_discount_request_hash(&command);
        if let Some(row) = load_apply_idempotency_row(&mut tx, &command).await? {
            if string_cell(&row, "request_hash") != request_hash {
                return Err(CommerceServiceError::conflict(
                    "idempotency key was used with a different promotion discount application request",
                ));
            }
            if string_cell(&row, "status") == "completed" {
                let coupon = replay_promotion_coupon_item(&row)?;
                tx.commit().await.map_err(|error| {
                    store_error(
                        "failed to commit promotion discount application replay",
                        error,
                    )
                })?;
                return Ok(coupon);
            }
            // 锁仍有效：另一个请求正在执行，拒绝并发抢占
            let locked_until = string_cell(&row, "locked_until");
            if !locked_until.is_empty() && locked_until > now {
                return Err(CommerceServiceError::conflict(
                    "another promotion discount application request is in progress for this idempotency key",
                ));
            }
            // 锁已过期：前序请求崩溃残留，抢占并继续执行
            refresh_apply_idempotency_lock(&mut tx, &command, &now).await?;
        } else {
            insert_apply_idempotency_lock(&mut tx, &command, &request_hash, &now).await?;
        }

        let coupon = load_user_coupon_for_discount_apply(&mut tx, &command).await?;
        ensure_user_coupon_can_be_applied(&coupon)?;
        let order = load_order_for_discount_apply(&mut tx, &command).await?;
        let application_id = discount_application_id(&command);
        insert_discount_application(&mut tx, &command, &coupon, &order, &application_id, &now)
            .await?;
        mark_user_coupon_applied(&mut tx, &command, &now).await?;
        let item = build_applied_promotion_coupon_item(&coupon, &now)?;
        complete_apply_idempotency(&mut tx, &command, &item, &now).await?;
        tx.commit().await.map_err(|error| {
            store_error(
                "failed to commit promotion discount application transaction",
                error,
            )
        })?;
        Ok(item)
    }

    pub async fn reverse_promotion_discount(
        &self,
        command: ReversePromotionDiscountCommand,
    ) -> Result<PromotionUserCouponItem, CommerceServiceError> {
        let mut tx = self.pool.begin().await.map_err(|error| {
            store_error(
                "failed to begin promotion discount reversal transaction",
                error,
            )
        })?;
        let now = current_timestamp_string();
        let request_hash = reverse_discount_request_hash(&command);
        if let Some(row) = load_reverse_idempotency_row(&mut tx, &command).await? {
            if string_cell(&row, "request_hash") != request_hash {
                return Err(CommerceServiceError::conflict(
                    "idempotency key was used with a different promotion discount reversal request",
                ));
            }
            if string_cell(&row, "status") == "completed" {
                let coupon = replay_promotion_coupon_item(&row)?;
                tx.commit().await.map_err(|error| {
                    store_error("failed to commit promotion discount reversal replay", error)
                })?;
                return Ok(coupon);
            }
            // 锁仍有效：另一个请求正在执行，拒绝并发抢占
            let locked_until = string_cell(&row, "locked_until");
            if !locked_until.is_empty() && locked_until > now {
                return Err(CommerceServiceError::conflict(
                    "another promotion discount reversal request is in progress for this idempotency key",
                ));
            }
            // 锁已过期：前序请求崩溃残留，抢占并继续执行
            refresh_reverse_idempotency_lock(&mut tx, &command, &now).await?;
        } else {
            insert_reverse_idempotency_lock(&mut tx, &command, &request_hash, &now).await?;
        }

        let coupon = load_user_coupon_for_discount_reverse(&mut tx, &command).await?;
        reverse_discount_application(&mut tx, &command, &now).await?;
        restore_user_coupon_after_reverse(&mut tx, &command, &now).await?;
        let item = build_reversed_promotion_coupon_item(&coupon, &now)?;
        complete_reverse_idempotency(&mut tx, &command, &item, &now).await?;
        tx.commit().await.map_err(|error| {
            store_error(
                "failed to commit promotion discount reversal transaction",
                error,
            )
        })?;
        Ok(item)
    }

    async fn find_applied_promotion_coupon(
        &self,
        command: &ApplyPromotionDiscountCommand,
    ) -> Result<Option<PromotionUserCouponItem>, CommerceServiceError> {
        let row = sqlx::query(
            r#"
            SELECT c.id,
                   COALESCE(NULLIF(c.coupon_code, ''), '-') AS code,
                   CAST(a.discount_amount AS TEXT) AS amount,
                   CAST(a.applied_at AS TEXT) AS date,
                   c.status AS status
            FROM promotion_discount_application a
            JOIN promotion_user_coupon c
              ON c.tenant_id = a.tenant_id
             AND c.id = a.user_coupon_id
            WHERE a.tenant_id = CAST($1 AS TEXT)
              AND ((a.organization_id = CAST($2 AS TEXT)) OR (a.organization_id IS NULL AND $3 IS NULL))
              AND a.order_id = CAST($4 AS TEXT)
              AND a.user_coupon_id = CAST($5 AS TEXT)
              AND LOWER(COALESCE(a.status, '')) IN ('applied', 'settled')
            LIMIT 1
           "#,
        )
        .bind(&command.tenant_id)
        .bind(command.organization_id.as_deref())
        .bind(command.organization_id.as_deref())
        .bind(&command.order_id)
        .bind(&command.user_coupon_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| store_error("failed to load existing discount application", error))?;

        row.map(|row| {
            let status =
                coupon_status_label(&required_status_cell(&row, "status", "apply")?)?.to_owned();
            PromotionUserCouponItem::new(
                &string_cell(&row, "id"),
                &string_cell(&row, "code"),
                &string_cell(&row, "amount"),
                &string_cell(&row, "date"),
                &status,
            )
        })
        .transpose()
    }
}

#[derive(Debug, Clone)]
struct DiscountApplyCoupon {
    id: String,
    code: String,
    offer_id: String,
    offer_version_id: String,
    discount_value: String,
    status: String,
}

#[derive(Debug, Clone)]
struct DiscountApplyOrder {
    order_no: String,
    currency_code: String,
}

fn apply_discount_request_hash(command: &ApplyPromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "apply-discount",
        &command.tenant_id,
        command.organization_id.as_deref().unwrap_or("global"),
        &command.owner_user_id,
        &command.order_id,
        &command.user_coupon_id,
        &command.request_no,
    ])
}

fn reverse_discount_request_hash(command: &ReversePromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "reverse-discount",
        &command.tenant_id,
        command.organization_id.as_deref().unwrap_or("global"),
        &command.owner_user_id,
        &command.user_coupon_id,
        command.reason.as_deref().unwrap_or("none"),
        &command.request_no,
    ])
}

fn discount_application_id(command: &ApplyPromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "discount-application",
        &command.tenant_id,
        &command.order_id,
        &command.user_coupon_id,
    ])
}

fn discount_application_no(command: &ApplyPromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "discount-application-no",
        &command.tenant_id,
        &command.request_no,
    ])
}

fn apply_idempotency_id(command: &ApplyPromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "apply-idempotency",
        &command.tenant_id,
        &command.idempotency_key,
    ])
}

fn reverse_idempotency_id(command: &ReversePromotionDiscountCommand) -> String {
    stable_storage_id(&[
        "reverse-idempotency",
        &command.tenant_id,
        &command.idempotency_key,
    ])
}

async fn load_apply_idempotency_row(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
) -> Result<Option<sqlx::postgres::PgRow>, CommerceServiceError> {
    sqlx::query(
        r#"
        SELECT request_hash, response_json, status, locked_until
        FROM commerce_idempotency_key
        WHERE tenant_id = $1 AND scope = $2 AND idempotency_key = $3
        LIMIT 1
        FOR UPDATE
       "#,
    )
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_CREATE_SCOPE)
    .bind(&command.idempotency_key)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load apply idempotency record", error))
}

async fn refresh_apply_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET status = 'locked', locked_until = $1, expires_at = $2, updated_at = $3
        WHERE tenant_id = $4 AND scope = $5 AND idempotency_key = $6
       "#,
    )
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_CREATE_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to refresh apply idempotency lock", error))?;
    Ok(())
}

async fn insert_apply_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
    request_hash: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        INSERT INTO commerce_idempotency_key
            (id, tenant_id, organization_id, scope, idempotency_key, request_hash,
             status, locked_until, expires_at, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, 'locked', $7, $8, $9, $10)
       "#,
    )
    .bind(apply_idempotency_id(command))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(PROMOTION_DISCOUNT_APPLICATION_CREATE_SCOPE)
    .bind(&command.idempotency_key)
    .bind(request_hash)
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert apply idempotency lock", error))?;
    Ok(())
}

async fn complete_apply_idempotency(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
    coupon: &PromotionUserCouponItem,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let response_json = serde_json::json!({
        "id": coupon.id,
        "code": coupon.code,
        "amount": coupon.amount.as_str(),
        "date": coupon.date,
        "status": coupon.status,
    })
    .to_string();
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET response_json = $1, status = 'completed', locked_until = NULL, updated_at = $2
        WHERE tenant_id = $3 AND scope = $4 AND idempotency_key = $5
       "#,
    )
    .bind(response_json)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_CREATE_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to complete apply idempotency record", error))?;
    Ok(())
}

async fn load_reverse_idempotency_row(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
) -> Result<Option<sqlx::postgres::PgRow>, CommerceServiceError> {
    sqlx::query(
        r#"
        SELECT request_hash, response_json, status, locked_until
        FROM commerce_idempotency_key
        WHERE tenant_id = $1 AND scope = $2 AND idempotency_key = $3
        LIMIT 1
        FOR UPDATE
       "#,
    )
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_REVERSAL_SCOPE)
    .bind(&command.idempotency_key)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load reverse idempotency record", error))
}

async fn refresh_reverse_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET status = 'locked', locked_until = $1, expires_at = $2, updated_at = $3
        WHERE tenant_id = $4 AND scope = $5 AND idempotency_key = $6
       "#,
    )
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_REVERSAL_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to refresh reverse idempotency lock", error))?;
    Ok(())
}

async fn insert_reverse_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
    request_hash: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        INSERT INTO commerce_idempotency_key
            (id, tenant_id, organization_id, scope, idempotency_key, request_hash,
             status, locked_until, expires_at, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, 'locked', $7, $8, $9, $10)
       "#,
    )
    .bind(reverse_idempotency_id(command))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(PROMOTION_DISCOUNT_APPLICATION_REVERSAL_SCOPE)
    .bind(&command.idempotency_key)
    .bind(request_hash)
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert reverse idempotency lock", error))?;
    Ok(())
}

async fn complete_reverse_idempotency(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
    coupon: &PromotionUserCouponItem,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let response_json = serde_json::json!({
        "id": coupon.id,
        "code": coupon.code,
        "amount": coupon.amount.as_str(),
        "date": coupon.date,
        "status": coupon.status,
    })
    .to_string();
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET response_json = $1, status = 'completed', locked_until = NULL, updated_at = $2
        WHERE tenant_id = $3 AND scope = $4 AND idempotency_key = $5
       "#,
    )
    .bind(response_json)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_DISCOUNT_APPLICATION_REVERSAL_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to complete reverse idempotency record", error))?;
    Ok(())
}

fn replay_promotion_coupon_item(
    row: &sqlx::postgres::PgRow,
) -> Result<PromotionUserCouponItem, CommerceServiceError> {
    let response_json = optional_string_cell(row, "response_json").ok_or_else(|| {
        CommerceServiceError::invalid_state("promotion idempotency record has no response")
    })?;
    let value: serde_json::Value = serde_json::from_str(&response_json).map_err(|error| {
        CommerceServiceError::storage(format!("invalid promotion idempotency response: {error}"))
    })?;
    PromotionUserCouponItem::new(
        value
            .get("id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("promotion response id is missing"))?,
        value
            .get("code")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("promotion response code is missing"))?,
        value
            .get("amount")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("promotion response amount is missing"))?,
        value
            .get("date")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("promotion response date is missing"))?,
        value
            .get("status")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("promotion response status is missing"))?,
    )
}

async fn load_user_coupon_for_discount_apply(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
) -> Result<DiscountApplyCoupon, CommerceServiceError> {
    let row = sqlx::query(
        r#"
        SELECT c.id,
               COALESCE(NULLIF(c.coupon_code, ''), '-') AS code,
               c.offer_id,
               c.offer_version_id,
               CAST(v.discount_value AS TEXT) AS discount_value,
               c.status
        FROM promotion_user_coupon c
        JOIN promotion_offer_version v
          ON v.tenant_id = c.tenant_id
         AND v.id = c.offer_version_id
        WHERE c.tenant_id = CAST($1 AS TEXT)
          AND ((c.organization_id = CAST($2 AS TEXT)) OR (c.organization_id IS NULL AND $3 IS NULL))
          AND c.id = CAST($4 AS TEXT)
          AND c.owner_user_id = CAST($5 AS TEXT)
          AND c.subject_type = $6
          AND c.subject_id = CAST($7 AS TEXT)
        LIMIT 1
        FOR UPDATE
       "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(command.organization_id.as_deref())
    .bind(&command.user_coupon_id)
    .bind(&command.owner_user_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load user coupon for discount apply", error))?
    .ok_or_else(|| CommerceServiceError::not_found("user coupon was not found"))?;

    Ok(DiscountApplyCoupon {
        id: string_cell(&row, "id"),
        code: string_cell(&row, "code"),
        offer_id: string_cell(&row, "offer_id"),
        offer_version_id: string_cell(&row, "offer_version_id"),
        discount_value: string_cell(&row, "discount_value"),
        status: string_cell(&row, "status"),
    })
}

async fn load_user_coupon_for_discount_reverse(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
) -> Result<DiscountApplyCoupon, CommerceServiceError> {
    let row = sqlx::query(
        r#"
        SELECT c.id,
               COALESCE(NULLIF(c.coupon_code, ''), '-') AS code,
               c.offer_id,
               c.offer_version_id,
               CAST(COALESCE(a.discount_amount, v.discount_value, '0') AS TEXT) AS discount_value,
               c.status
        FROM promotion_user_coupon c
        JOIN promotion_offer_version v
          ON v.tenant_id = c.tenant_id
         AND v.id = c.offer_version_id
        LEFT JOIN promotion_discount_application a
          ON a.tenant_id = c.tenant_id
         AND a.user_coupon_id = c.id
         AND LOWER(COALESCE(a.status, '')) IN ('applied', 'settled')
        WHERE c.tenant_id = CAST($1 AS TEXT)
          AND ((c.organization_id = CAST($2 AS TEXT)) OR (c.organization_id IS NULL AND $3 IS NULL))
          AND c.id = CAST($4 AS TEXT)
          AND c.owner_user_id = CAST($5 AS TEXT)
          AND c.subject_type = $6
          AND c.subject_id = CAST($7 AS TEXT)
        LIMIT 1
       "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(command.organization_id.as_deref())
    .bind(&command.user_coupon_id)
    .bind(&command.owner_user_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load user coupon for discount reverse", error))?
    .ok_or_else(|| CommerceServiceError::not_found("user coupon was not found"))?;

    Ok(DiscountApplyCoupon {
        id: string_cell(&row, "id"),
        code: string_cell(&row, "code"),
        offer_id: string_cell(&row, "offer_id"),
        offer_version_id: string_cell(&row, "offer_version_id"),
        discount_value: string_cell(&row, "discount_value"),
        status: string_cell(&row, "status"),
    })
}

fn ensure_user_coupon_can_be_applied(
    coupon: &DiscountApplyCoupon,
) -> Result<(), CommerceServiceError> {
    match coupon.status.trim().to_ascii_lowercase().as_str() {
        "claimed" | "issued" | "active" | "pending" | "claimable" => Ok(()),
        "used" | "redeemed" => Err(CommerceServiceError::conflict(
            "user coupon has already been applied",
        )),
        "expired" | "disabled" | "voided" | "cancelled" => {
            Err(CommerceServiceError::conflict("user coupon is not usable"))
        }
        status => Err(CommerceServiceError::conflict(format!(
            "user coupon status {status} is not applicable"
        ))),
    }
}

async fn load_order_for_discount_apply(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
) -> Result<DiscountApplyOrder, CommerceServiceError> {
    let row = sqlx::query(
        r#"
        SELECT order_no, currency_code, status
        FROM commerce_order
        WHERE tenant_id = CAST($1 AS TEXT)
          AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $3 IS NULL))
          AND id = CAST($4 AS TEXT)
          AND owner_user_id = CAST($5 AS TEXT)
          AND LOWER(COALESCE(status, '')) IN (
              'draft', 'pending', 'pending_payment', 'unpaid', 'wait_pay'
          )
        LIMIT 1
       "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(command.organization_id.as_deref())
    .bind(&command.order_id)
    .bind(&command.owner_user_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load order for discount apply", error))?
    .ok_or_else(|| CommerceServiceError::conflict("order is not discount applicable"))?;

    Ok(DiscountApplyOrder {
        order_no: string_cell(&row, "order_no"),
        currency_code: string_cell(&row, "currency_code"),
    })
}

async fn insert_discount_application(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
    coupon: &DiscountApplyCoupon,
    order: &DiscountApplyOrder,
    application_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    sqlx::query(
        r#"
        INSERT INTO promotion_discount_application
            (id, tenant_id, organization_id, application_no, offer_id, offer_version_id,
             user_coupon_id, order_id, order_no, subject_type, subject_id, discount_amount,
             currency_code, status, request_no, idempotency_key, applied_at, rolled_back_at,
             created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'applied', $14, $15, $16, NULL, $17, $18)
       "#,
    )
    .bind(application_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(discount_application_no(command))
    .bind(&coupon.offer_id)
    .bind(&coupon.offer_version_id)
    .bind(&coupon.id)
    .bind(&command.order_id)
    .bind(&order.order_no)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(&coupon.discount_value)
    .bind(&order.currency_code)
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert promotion discount application", error))?;
    Ok(())
}

async fn mark_user_coupon_applied(
    tx: &mut Transaction<'_, Postgres>,
    command: &ApplyPromotionDiscountCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let updated = sqlx::query(
        r#"
        UPDATE promotion_user_coupon
        SET status = 'used', redeemed_at = $1, updated_at = $2
        WHERE tenant_id = CAST($3 AS TEXT)
          AND id = CAST($4 AS TEXT)
          AND owner_user_id = CAST($5 AS TEXT)
          AND LOWER(COALESCE(status, '')) IN ('claimed', 'issued', 'active', 'pending', 'claimable')
       "#,
    )
    .bind(now)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(&command.user_coupon_id)
    .bind(&command.owner_user_id)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to mark user coupon applied", error))?
    .rows_affected();

    if updated != 1 {
        return Err(CommerceServiceError::conflict(
            "user coupon has already been applied or is not applicable",
        ));
    }
    Ok(())
}

async fn reverse_discount_application(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let updated = sqlx::query(
        r#"
        UPDATE promotion_discount_application
        SET status = 'reversed', rolled_back_at = $1, updated_at = $2
        WHERE tenant_id = CAST($3 AS TEXT)
          AND user_coupon_id = CAST($4 AS TEXT)
          AND subject_type = $5
          AND subject_id = CAST($6 AS TEXT)
          AND LOWER(COALESCE(status, '')) IN ('applied', 'settled')
       "#,
    )
    .bind(now)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(&command.user_coupon_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to reverse promotion discount application", error))?
    .rows_affected();

    if updated == 0 {
        return Err(CommerceServiceError::conflict(
            "active promotion discount application was not found",
        ));
    }
    Ok(())
}

async fn restore_user_coupon_after_reverse(
    tx: &mut Transaction<'_, Postgres>,
    command: &ReversePromotionDiscountCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let updated = sqlx::query(
        r#"
        UPDATE promotion_user_coupon
        SET status = 'claimed', redeemed_at = NULL, updated_at = $1
        WHERE tenant_id = CAST($2 AS TEXT)
          AND id = CAST($3 AS TEXT)
          AND owner_user_id = CAST($4 AS TEXT)
          AND LOWER(COALESCE(status, '')) = 'used'
       "#,
    )
    .bind(now)
    .bind(&command.tenant_id)
    .bind(&command.user_coupon_id)
    .bind(&command.owner_user_id)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to restore user coupon after reverse", error))?
    .rows_affected();

    if updated != 1 {
        return Err(CommerceServiceError::conflict(
            "user coupon was not in used state and could not be restored",
        ));
    }
    Ok(())
}

fn build_applied_promotion_coupon_item(
    coupon: &DiscountApplyCoupon,
    now: &str,
) -> Result<PromotionUserCouponItem, CommerceServiceError> {
    PromotionUserCouponItem::new(
        &coupon.id,
        &coupon.code,
        &coupon.discount_value,
        now,
        "success",
    )
}

fn build_reversed_promotion_coupon_item(
    coupon: &DiscountApplyCoupon,
    now: &str,
) -> Result<PromotionUserCouponItem, CommerceServiceError> {
    PromotionUserCouponItem::new(
        &coupon.id,
        &coupon.code,
        &coupon.discount_value,
        now,
        "pending",
    )
}

async fn load_redeem_idempotency_row(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
) -> Result<Option<sqlx::postgres::PgRow>, CommerceServiceError> {
    sqlx::query(
        r#"
        SELECT request_hash, response_json, status, locked_until
        FROM commerce_idempotency_key
        WHERE tenant_id = $1 AND scope = $2 AND idempotency_key = $3
        LIMIT 1
        FOR UPDATE
        "#,
    )
    .bind(&command.tenant_id)
    .bind(PROMOTION_CODE_REDEMPTION_SCOPE)
    .bind(&command.idempotency_key)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load redeem idempotency record", error))
}

async fn refresh_redeem_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET status = 'locked',
            locked_until = $1,
            expires_at = $2,
            updated_at = $3
        WHERE tenant_id = $4 AND scope = $5 AND idempotency_key = $6
        "#,
    )
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_CODE_REDEMPTION_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to refresh redeem idempotency lock", error))?;
    Ok(())
}

async fn insert_redeem_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    request_hash: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"
        INSERT INTO commerce_idempotency_key
            (id, tenant_id, organization_id, scope, idempotency_key, request_hash,
             response_json, status, locked_until, expires_at, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, NULL, 'locked', $7, $8, $9, $10)
        "#,
    )
    .bind(redeem_idempotency_id(command))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(PROMOTION_CODE_REDEMPTION_SCOPE)
    .bind(&command.idempotency_key)
    .bind(request_hash)
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert redeem idempotency lock", error))?;
    Ok(())
}

async fn complete_redeem_idempotency(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    outcome: &PromotionCodeRedemptionOutcome,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let response_json = serde_json::json!({
        "message": outcome.message,
        "amount": outcome.amount.as_str(),
        "creditedPoints": outcome.credited_points,
        "balance": outcome.balance,
    })
    .to_string();
    sqlx::query(
        r#"
        UPDATE commerce_idempotency_key
        SET response_json = $1,
            status = 'completed',
            locked_until = NULL,
            updated_at = $2
        WHERE tenant_id = $3 AND scope = $4 AND idempotency_key = $5
        "#,
    )
    .bind(response_json)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_CODE_REDEMPTION_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to complete redeem idempotency record", error))?;
    Ok(())
}

fn replay_redeem_outcome(
    row: &sqlx::postgres::PgRow,
) -> Result<PromotionCodeRedemptionOutcome, CommerceServiceError> {
    let response_json = optional_string_cell(row, "response_json").ok_or_else(|| {
        CommerceServiceError::invalid_state("redeem idempotency record has no response")
    })?;
    let value: serde_json::Value = serde_json::from_str(&response_json).map_err(|error| {
        CommerceServiceError::storage(format!("invalid redeem idempotency response: {error}"))
    })?;
    let message = value
        .get("message")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| CommerceServiceError::storage("redeem response message is missing"))?;
    let amount = value
        .get("amount")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| CommerceServiceError::storage("redeem response amount is missing"))?;
    let credited_points = value
        .get("creditedPoints")
        .and_then(serde_json::Value::as_i64)
        .ok_or_else(|| {
            CommerceServiceError::storage("redeem response creditedPoints is missing")
        })?;
    let balance = value
        .get("balance")
        .and_then(serde_json::Value::as_i64)
        .ok_or_else(|| CommerceServiceError::storage("redeem response balance is missing"))?;

    PromotionCodeRedemptionOutcome::new(message, amount, credited_points, balance)
}

async fn load_promotion_for_redeem(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    now: &str,
) -> Result<RedeemPromotion, CommerceServiceError> {
    let row = sqlx::query(
        r#"
        SELECT pc.id AS code_id,
               s.id AS stock_id,
               pc.offer_id AS offer_id,
               s.offer_version_id AS offer_version_id,
               s.stock_type AS stock_type,
               CAST(v.discount_value AS TEXT) AS discount_value,
               COALESCE(v.currency_code, 'CNY') AS currency_code,
               s.total_quantity AS total_quantity,
               COALESCE(s.available_quantity, 0) AS available_quantity,
               COALESCE(s.claimed_quantity, 0) AS stock_claimed_quantity,
               COALESCE(pc.max_claims, 1) AS code_max_claims,
               COALESCE(pc.claimed_quantity, 0) AS code_claimed_quantity,
               CAST(COALESCE(pc.expires_at, s.expires_at, o.ends_at) AS TEXT) AS expires_at
        FROM promotion_code pc
        JOIN promotion_coupon_stock s
          ON s.tenant_id = pc.tenant_id
         AND s.id = pc.stock_id
        JOIN promotion_offer o
          ON o.tenant_id = pc.tenant_id
         AND o.id = pc.offer_id
        JOIN promotion_offer_version v
          ON v.tenant_id = pc.tenant_id
         AND v.id = s.offer_version_id
        WHERE pc.tenant_id = CAST($1 AS TEXT)
          AND ((pc.organization_id = CAST($2 AS TEXT)) OR (pc.organization_id IS NULL AND $2 IS NULL))
          AND pc.promotion_code = CAST($3 AS TEXT)
          AND pc.status = 'active'
          AND s.status = 'active'
          AND o.status = 'active'
          AND v.lifecycle_status = 'published'
          AND (pc.starts_at IS NULL OR pc.starts_at <= $4)
          AND (pc.expires_at IS NULL OR pc.expires_at >= $4)
          AND (s.starts_at IS NULL OR s.starts_at <= $4)
          AND (s.expires_at IS NULL OR s.expires_at >= $4)
          AND (o.starts_at IS NULL OR o.starts_at <= $4)
          AND (o.ends_at IS NULL OR o.ends_at >= $4)
        ORDER BY pc.organization_id DESC NULLS LAST, pc.id ASC
        LIMIT 1
        FOR UPDATE OF pc, s
        "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(&command.code)
    .bind(now)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load promotion code", error))?
    .ok_or_else(|| CommerceServiceError::conflict("promotion code is invalid or unavailable"))?;

    Ok(RedeemPromotion {
        code_id: string_cell(&row, "code_id"),
        stock_id: string_cell(&row, "stock_id"),
        offer_id: string_cell(&row, "offer_id"),
        offer_version_id: string_cell(&row, "offer_version_id"),
        stock_type: string_cell(&row, "stock_type"),
        discount_value: string_cell(&row, "discount_value"),
        currency_code: string_cell(&row, "currency_code"),
        total_quantity: optional_integer_cell(&row, "total_quantity"),
        available_quantity: integer_cell(&row, "available_quantity"),
        stock_claimed_quantity: integer_cell(&row, "stock_claimed_quantity"),
        code_max_claims: integer_cell(&row, "code_max_claims"),
        code_claimed_quantity: integer_cell(&row, "code_claimed_quantity"),
        expires_at: optional_string_cell(&row, "expires_at"),
    })
}

async fn ensure_promotion_can_be_redeemed(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    promotion: &RedeemPromotion,
) -> Result<(), CommerceServiceError> {
    let requires_stock_quantity = promotion_requires_stock_quantity(promotion);
    if let Some(total_quantity) = promotion.total_quantity {
        if promotion.stock_claimed_quantity >= total_quantity || promotion.available_quantity <= 0 {
            return Err(CommerceServiceError::conflict(
                "promotion code has reached its issue limit",
            ));
        }
    } else if requires_stock_quantity && promotion.available_quantity <= 0 {
        return Err(CommerceServiceError::conflict(
            "promotion code has reached its issue limit",
        ));
    }
    if promotion.code_max_claims > 0 && promotion.code_claimed_quantity >= promotion.code_max_claims
    {
        return Err(CommerceServiceError::conflict(
            "promotion code has reached its issue limit",
        ));
    }
    let received_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(1)
        FROM promotion_user_coupon
        WHERE tenant_id = CAST($1 AS TEXT)
          AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $2 IS NULL))
          AND subject_type = $3
          AND subject_id = CAST($4 AS TEXT)
          AND code_id = $5
        "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(&promotion.code_id)
    .fetch_one(&mut **tx)
    .await
    .map_err(|error| store_error("failed to check promotion code subject limit", error))?;
    if received_count > 0 {
        return Err(CommerceServiceError::conflict(
            "promotion code subject receive limit has been reached",
        ));
    }
    Ok(())
}

async fn ensure_points_account(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    now: &str,
) -> Result<PointsAccount, CommerceServiceError> {
    if let Some(account) = load_points_account(tx, command).await? {
        return Ok(account);
    }

    let account_id = account_id(command);
    sqlx::query(
        r#"
        INSERT INTO commerce_account
            (id, tenant_id, organization_id, owner_user_id, asset_type, currency_code,
             available_amount, frozen_amount, version, status, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, '0', '0', 0, 'active', $7, $8)
        ON CONFLICT (tenant_id, organization_id, owner_user_id, asset_type, currency_code)
        DO NOTHING
        "#,
    )
    .bind(&account_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(&command.owner_user_id)
    .bind(CommerceAccountAssetType::Points.as_str())
    .bind(POINTS_CURRENCY_CODE)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to create points account", error))?;

    load_points_account(tx, command).await?.ok_or_else(|| {
        CommerceServiceError::storage("points account was not available after creation")
    })
}

async fn load_points_account(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
) -> Result<Option<PointsAccount>, CommerceServiceError> {
    let row = sqlx::query(
        r#"
        SELECT id, CAST(COALESCE(available_amount, '0') AS BIGINT) AS available_points
        FROM commerce_account
        WHERE tenant_id = CAST($1 AS TEXT)
          AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $2 IS NULL))
          AND owner_user_id = CAST($3 AS TEXT)
          AND asset_type = $4
          AND currency_code = $5
          AND status = 'active'
        ORDER BY id ASC
        LIMIT 1
        FOR UPDATE
        "#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(&command.owner_user_id)
    .bind(CommerceAccountAssetType::Points.as_str())
    .bind(POINTS_CURRENCY_CODE)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load points account", error))?;

    Ok(row.map(|row| PointsAccount {
        id: string_cell(&row, "id"),
        available_points: integer_cell(&row, "available_points"),
    }))
}

async fn insert_user_coupon(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    promotion: &RedeemPromotion,
    coupon_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    sqlx::query(
        r#"
        INSERT INTO promotion_user_coupon
            (id, tenant_id, organization_id, coupon_no, stock_id, code_id, offer_id,
             offer_version_id, subject_type, subject_id, owner_user_id, coupon_code,
             status, claimed_at, valid_from, expires_at, redeemed_at, disabled_at,
             request_no, idempotency_key, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
             'redeemed', $13, $14, $15, $16, NULL, $17, $18, $19, $20)
        "#,
    )
    .bind(coupon_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(coupon_no(command))
    .bind(&promotion.stock_id)
    .bind(&promotion.code_id)
    .bind(&promotion.offer_id)
    .bind(&promotion.offer_version_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(&command.owner_user_id)
    .bind(issued_coupon_code(command))
    .bind(now)
    .bind(now)
    .bind(promotion.expires_at.as_deref())
    .bind(now)
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to issue user coupon", error))?;
    Ok(())
}

async fn insert_coupon_ledger_entry(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    promotion: &RedeemPromotion,
    coupon_id: &str,
    coupon_ledger_entry_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let balance_after = (promotion.available_quantity - 1).max(0);
    sqlx::query(
        r#"
        INSERT INTO promotion_coupon_ledger_entry
            (id, tenant_id, organization_id, ledger_no, user_coupon_id, stock_id, offer_id,
             subject_type, subject_id, direction, quantity_delta, balance_after, business_type,
             source_type, source_id, request_no, idempotency_key, occurred_at, created_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'debit', -1, $10, 'redeem',
             $11, $12, $13, $14, $15, $16)
        "#,
    )
    .bind(coupon_ledger_entry_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(coupon_ledger_no(command))
    .bind(coupon_id)
    .bind(&promotion.stock_id)
    .bind(&promotion.offer_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(balance_after)
    .bind(PROMOTION_USER_COUPON_SOURCE_TYPE)
    .bind(coupon_id)
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to record promotion coupon ledger entry", error))?;
    Ok(())
}

async fn update_promotion_counters(
    tx: &mut Transaction<'_, Postgres>,
    promotion: &RedeemPromotion,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let requires_stock_quantity = if promotion_requires_stock_quantity(promotion) {
        1_i64
    } else {
        0_i64
    };
    let stock_update = sqlx::query(
        r#"
        UPDATE promotion_coupon_stock
        SET available_quantity = CASE
                WHEN $1 = 1 THEN available_quantity - 1
                ELSE available_quantity
            END,
            claimed_quantity = COALESCE(claimed_quantity, 0) + 1,
            redeemed_quantity = COALESCE(redeemed_quantity, 0) + 1,
            updated_at = $2
        WHERE id = $3
          AND status = 'active'
          AND ($4 = 0 OR available_quantity > 0)
          AND COALESCE(claimed_quantity, 0) = $5
          AND ($6 IS NULL OR COALESCE(claimed_quantity, 0) < $7)
        "#,
    )
    .bind(requires_stock_quantity)
    .bind(now)
    .bind(&promotion.stock_id)
    .bind(requires_stock_quantity)
    .bind(promotion.stock_claimed_quantity)
    .bind(promotion.total_quantity)
    .bind(promotion.total_quantity)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to update promotion coupon stock counters", error))?;
    if stock_update.rows_affected() != 1 {
        return Err(CommerceServiceError::conflict(
            "promotion coupon stock was not updated atomically",
        ));
    }

    let code_update = sqlx::query(
        r#"
        UPDATE promotion_code
        SET claimed_quantity = COALESCE(claimed_quantity, 0) + 1,
            updated_at = $1
        WHERE id = $2
          AND status = 'active'
          AND COALESCE(claimed_quantity, 0) = $3
          AND ($4 <= 0 OR COALESCE(claimed_quantity, 0) < $5)
        "#,
    )
    .bind(now)
    .bind(&promotion.code_id)
    .bind(promotion.code_claimed_quantity)
    .bind(promotion.code_max_claims)
    .bind(promotion.code_max_claims)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to update promotion code counters", error))?;
    if code_update.rows_affected() != 1 {
        return Err(CommerceServiceError::conflict(
            "promotion code counter was not updated atomically",
        ));
    }
    Ok(())
}

async fn update_account_points(
    tx: &mut Transaction<'_, Postgres>,
    account_id: &str,
    current_available_points: i64,
    credited_points: i64,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let max_allowed_before_credit = i64::MAX
        .checked_sub(credited_points)
        .ok_or_else(|| CommerceServiceError::storage("promotion credit points overflow"))?;
    let account_update = sqlx::query(
        r#"
        UPDATE commerce_account
        SET available_amount = (available_amount::bigint + $1)::text,
            version = version + 1,
            updated_at = $2
        WHERE id = $3
          AND COALESCE(available_amount, '') ~ '^[0-9]+$'
          AND available_amount::bigint = $4
          AND available_amount::bigint <= $5
        "#,
    )
    .bind(credited_points)
    .bind(now)
    .bind(account_id)
    .bind(current_available_points)
    .bind(max_allowed_before_credit)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to update account points", error))?;
    if account_update.rows_affected() != 1 {
        return Err(CommerceServiceError::conflict(
            "promotion points account was not updated atomically",
        ));
    }
    Ok(())
}

async fn insert_account_ledger(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    account_id: &str,
    balance_after: i64,
    credited_points: i64,
    source_coupon_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    sqlx::query(
        r#"
        INSERT INTO commerce_account_ledger_entry
            (id, tenant_id, organization_id, account_id, owner_user_id, asset_type, direction,
             amount, balance_after, business_type, transaction_no, request_no, idempotency_key,
             source_type, source_id, remark, created_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'redeem', $10, $11, $12, $13, $14, $15, $16)
        "#,
    )
    .bind(ledger_entry_id(command))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(account_id)
    .bind(&command.owner_user_id)
    .bind(CommerceAccountAssetType::Points.as_str())
    .bind(CommerceLedgerDirection::Credit.as_str())
    .bind(credited_points.to_string())
    .bind(balance_after.to_string())
    .bind(&command.request_no)
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(PROMOTION_USER_COUPON_SOURCE_TYPE)
    .bind(source_coupon_id)
    .bind(format!("redeem_promotion_code={}", command.code))
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert account ledger entry", error))?;
    Ok(())
}

async fn insert_redeem_billing_history(
    tx: &mut Transaction<'_, Postgres>,
    command: &PromotionCodeRedemptionCommand,
    source_coupon_id: &str,
    amount: &str,
    currency_code: &str,
    credited_points: i64,
    now: &str,
) -> Result<(), CommerceServiceError> {
    sqlx::query(
        r#"
        INSERT INTO commerce_billing_history
            (id, tenant_id, organization_id, owner_user_id, history_no, history_type,
             direction, asset_type, amount, currency_code, points_delta, status,
             title, reference_no, source_type, source_id, related_order_id,
             related_order_no, payment_method, occurred_at, metadata_json, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, 'redeem',
             'credit', 'points', $6, $7, $8, 'success',
             'Promotion code redemption', $9, $10, $11, NULL,
             NULL, NULL, $12, NULL, $12, $12)
        ON CONFLICT (tenant_id, source_type, source_id) DO NOTHING
        "#,
    )
    .bind(format!("billing-history-{source_coupon_id}"))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(&command.owner_user_id)
    .bind(format!("BH-{source_coupon_id}"))
    .bind(amount)
    .bind(currency_code)
    .bind(credited_points)
    .bind(&command.code)
    .bind(PROMOTION_USER_COUPON_SOURCE_TYPE)
    .bind(source_coupon_id)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert redeem billing history", error))?;
    Ok(())
}

async fn load_claim_idempotency_row(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
) -> Result<Option<sqlx::postgres::PgRow>, CommerceServiceError> {
    sqlx::query(
        r#"

        SELECT request_hash, response_json, status, locked_until
        FROM commerce_idempotency_key
        WHERE tenant_id = $1 AND scope = $2 AND idempotency_key = $3
        LIMIT 1
        FOR UPDATE

"#,
    )
    .bind(&command.tenant_id)
    .bind(PROMOTION_USER_COUPON_CLAIM_SCOPE)
    .bind(&command.idempotency_key)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load claim idempotency record", error))
}

async fn refresh_claim_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"

        UPDATE commerce_idempotency_key
        SET status = 'locked', locked_until = $1, expires_at = $2, updated_at = $3
        WHERE tenant_id = $4 AND scope = $5 AND idempotency_key = $6

"#,
    )
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_USER_COUPON_CLAIM_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to refresh claim idempotency lock", error))?;
    Ok(())
}

async fn insert_claim_idempotency_lock(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    request_hash: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let lock_expiry = lock_expiry_timestamp(now);
    let record_expiry = record_expiry_timestamp(now);
    sqlx::query(
        r#"

        INSERT INTO commerce_idempotency_key
            (id, tenant_id, organization_id, scope, idempotency_key, request_hash,
             response_json, status, locked_until, expires_at, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, NULL, 'locked', $7, $8, $9, $10)

"#,
    )
    .bind(claim_idempotency_id(command))
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(PROMOTION_USER_COUPON_CLAIM_SCOPE)
    .bind(&command.idempotency_key)
    .bind(request_hash)
    .bind(&lock_expiry)
    .bind(&record_expiry)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to insert claim idempotency lock", error))?;
    Ok(())
}

async fn complete_claim_idempotency(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    coupon: &PromotionUserCouponItem,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let response_json = serde_json::json!({
        "id": coupon.id,
        "code": coupon.code,
        "amount": coupon.amount.as_str(),
        "date": coupon.date,
        "status": coupon.status,
    })
    .to_string();
    sqlx::query(
        r#"

        UPDATE commerce_idempotency_key
        SET response_json = $1, status = 'completed', locked_until = NULL, updated_at = $2
        WHERE tenant_id = $3 AND scope = $4 AND idempotency_key = $5

"#,
    )
    .bind(response_json)
    .bind(now)
    .bind(&command.tenant_id)
    .bind(PROMOTION_USER_COUPON_CLAIM_SCOPE)
    .bind(&command.idempotency_key)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to complete claim idempotency record", error))?;
    Ok(())
}

fn replay_claim_coupon(
    row: &sqlx::postgres::PgRow,
) -> Result<PromotionUserCouponItem, CommerceServiceError> {
    let response_json = optional_string_cell(row, "response_json").ok_or_else(|| {
        CommerceServiceError::invalid_state("claim idempotency record has no response")
    })?;
    let value: serde_json::Value = serde_json::from_str(&response_json).map_err(|error| {
        CommerceServiceError::storage(format!("invalid claim idempotency response: {error}"))
    })?;
    PromotionUserCouponItem::new(
        value
            .get("id")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("claim response id is missing"))?,
        value
            .get("code")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("claim response code is missing"))?,
        value
            .get("amount")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("claim response amount is missing"))?,
        value
            .get("date")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("claim response date is missing"))?,
        value
            .get("status")
            .and_then(serde_json::Value::as_str)
            .ok_or_else(|| CommerceServiceError::storage("claim response status is missing"))?,
    )
}

async fn load_promotion_for_claim(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    now: &str,
) -> Result<ClaimPromotion, CommerceServiceError> {
    let row = sqlx::query(
        r#"

        SELECT s.id AS stock_id,
               s.offer_id AS offer_id,
               s.offer_version_id AS offer_version_id,
               s.stock_type AS stock_type,
               CAST(v.discount_value AS TEXT) AS discount_value,
               s.total_quantity AS total_quantity,
               COALESCE(s.available_quantity, 0) AS available_quantity,
               COALESCE(s.claimed_quantity, 0) AS stock_claimed_quantity,
               COALESCE(s.expires_at, o.ends_at) AS expires_at
        FROM promotion_offer o
        JOIN promotion_coupon_stock s
          ON s.tenant_id = o.tenant_id
         AND s.offer_id = o.id
        JOIN promotion_offer_version v
          ON v.tenant_id = s.tenant_id
         AND v.id = s.offer_version_id
        WHERE o.tenant_id = CAST($1 AS TEXT)
          AND ((o.organization_id = CAST($2 AS TEXT)) OR (o.organization_id IS NULL AND $3 IS NULL))
          AND o.id = CAST($4 AS TEXT)
          AND o.status = 'active'
          AND s.status = 'active'
          AND v.lifecycle_status = 'published'
          AND (s.starts_at IS NULL OR s.starts_at <= $5)
          AND (s.expires_at IS NULL OR s.expires_at >= $6)
          AND (o.starts_at IS NULL OR o.starts_at <= $7)
          AND (o.ends_at IS NULL OR o.ends_at >= $8)
        ORDER BY s.created_at ASC, s.id ASC
        LIMIT 1

"#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(command.organization_id.as_deref())
    .bind(&command.offer_id)
    .bind(now)
    .bind(now)
    .bind(now)
    .bind(now)
    .fetch_optional(&mut **tx)
    .await
    .map_err(|error| store_error("failed to load promotion offer for claim", error))?
    .ok_or_else(|| CommerceServiceError::conflict("promotion offer is invalid or unavailable"))?;

    Ok(ClaimPromotion {
        stock_id: string_cell(&row, "stock_id"),
        offer_id: string_cell(&row, "offer_id"),
        offer_version_id: string_cell(&row, "offer_version_id"),
        stock_type: string_cell(&row, "stock_type"),
        discount_value: string_cell(&row, "discount_value"),
        total_quantity: optional_integer_cell(&row, "total_quantity"),
        available_quantity: integer_cell(&row, "available_quantity"),
        stock_claimed_quantity: integer_cell(&row, "stock_claimed_quantity"),
        expires_at: optional_string_cell(&row, "expires_at"),
    })
}

async fn ensure_promotion_offer_can_be_claimed(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    promotion: &ClaimPromotion,
) -> Result<(), CommerceServiceError> {
    if promotion.total_quantity.is_some() && promotion.available_quantity <= 0 {
        return Err(CommerceServiceError::conflict(
            "promotion offer has reached its issue limit",
        ));
    }
    if promotion.stock_type.trim() != "unlimited" && promotion.available_quantity <= 0 {
        return Err(CommerceServiceError::conflict(
            "promotion offer has reached its issue limit",
        ));
    }
    let received_count: i64 = sqlx::query_scalar(
        r#"

        SELECT COUNT(1)
        FROM promotion_user_coupon
        WHERE tenant_id = CAST($1 AS TEXT)
          AND ((organization_id = CAST($2 AS TEXT)) OR (organization_id IS NULL AND $3 IS NULL))
          AND subject_type = $4
          AND subject_id = CAST($5 AS TEXT)
          AND offer_id = $6
          AND LOWER(COALESCE(status, '')) NOT IN ('expired', 'disabled', 'voided', 'cancelled')

"#,
    )
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(command.organization_id.as_deref())
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(&promotion.offer_id)
    .fetch_one(&mut **tx)
    .await
    .map_err(|error| store_error("failed to check promotion offer subject limit", error))?;
    if received_count > 0 {
        return Err(CommerceServiceError::conflict(
            "promotion offer subject receive limit has been reached",
        ));
    }
    Ok(())
}

async fn insert_claimed_user_coupon(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    promotion: &ClaimPromotion,
    coupon_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    sqlx::query(
        r#"

        INSERT INTO promotion_user_coupon
            (id, tenant_id, organization_id, coupon_no, stock_id, code_id, offer_id,
             offer_version_id, subject_type, subject_id, owner_user_id, coupon_code,
             status, claimed_at, valid_from, expires_at, redeemed_at, disabled_at,
             request_no, idempotency_key, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, $11, 'claimed', $12, $13, $14, NULL, NULL, $15, $16, $17, $18)

"#,
    )
    .bind(coupon_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(claim_coupon_no(command))
    .bind(&promotion.stock_id)
    .bind(&promotion.offer_id)
    .bind(&promotion.offer_version_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(&command.owner_user_id)
    .bind(issued_claim_coupon_code(command))
    .bind(now)
    .bind(now)
    .bind(promotion.expires_at.as_deref())
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to issue claimed user coupon", error))?;
    Ok(())
}

async fn insert_claim_coupon_ledger_entry(
    tx: &mut Transaction<'_, Postgres>,
    command: &ClaimPromotionUserCouponCommand,
    promotion: &ClaimPromotion,
    coupon_id: &str,
    coupon_ledger_entry_id: &str,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let balance_after = (promotion.available_quantity - 1).max(0);
    sqlx::query(
        r#"

        INSERT INTO promotion_coupon_ledger_entry
            (id, tenant_id, organization_id, ledger_no, user_coupon_id, stock_id, offer_id,
             subject_type, subject_id, direction, quantity_delta, balance_after, business_type,
             source_type, source_id, request_no, idempotency_key, occurred_at, created_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'debit', -1, $10, 'claim',
             $11, $12, $13, $14, $15, $16)

"#,
    )
    .bind(coupon_ledger_entry_id)
    .bind(&command.tenant_id)
    .bind(command.organization_id.as_deref())
    .bind(claim_coupon_ledger_no(command))
    .bind(coupon_id)
    .bind(&promotion.stock_id)
    .bind(&promotion.offer_id)
    .bind(USER_SUBJECT_TYPE)
    .bind(&command.owner_user_id)
    .bind(balance_after)
    .bind(PROMOTION_USER_COUPON_SOURCE_TYPE)
    .bind(coupon_id)
    .bind(&command.request_no)
    .bind(&command.idempotency_key)
    .bind(now)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to record promotion claim ledger entry", error))?;
    Ok(())
}

async fn update_claim_promotion_counters(
    tx: &mut Transaction<'_, Postgres>,
    promotion: &ClaimPromotion,
    now: &str,
) -> Result<(), CommerceServiceError> {
    let requires_stock_quantity =
        promotion.total_quantity.is_some() || promotion.stock_type.trim() != "unlimited";
    let requires_stock_quantity_flag = if requires_stock_quantity {
        1_i64
    } else {
        0_i64
    };
    let stock_update = sqlx::query(
        r#"

        UPDATE promotion_coupon_stock
        SET available_quantity = CASE
                WHEN $1 = 1 THEN available_quantity - 1
                ELSE available_quantity
            END,
            claimed_quantity = COALESCE(claimed_quantity, 0) + 1,
            updated_at = $2
        WHERE id = $3
          AND status = 'active'
          AND ($4 = 0 OR available_quantity > 0)
          AND COALESCE(claimed_quantity, 0) = $5
          AND ($6 IS NULL OR COALESCE(claimed_quantity, 0) < $7)

"#,
    )
    .bind(requires_stock_quantity_flag)
    .bind(now)
    .bind(&promotion.stock_id)
    .bind(requires_stock_quantity_flag)
    .bind(promotion.stock_claimed_quantity)
    .bind(promotion.total_quantity)
    .bind(promotion.total_quantity)
    .execute(&mut **tx)
    .await
    .map_err(|error| store_error("failed to update promotion claim stock counters", error))?;
    if stock_update.rows_affected() != 1 {
        return Err(CommerceServiceError::conflict(
            "promotion coupon stock was not updated atomically",
        ));
    }
    Ok(())
}

fn claim_request_hash(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&[
        "claim",
        &command.tenant_id,
        command.organization_id.as_deref().unwrap_or("global"),
        &command.owner_user_id,
        &command.offer_id,
        &command.request_no,
    ])
}

fn claim_idempotency_id(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&[
        "idem",
        &command.tenant_id,
        PROMOTION_USER_COUPON_CLAIM_SCOPE,
        &command.idempotency_key,
    ])
}

fn claim_coupon_id(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&["claim-coupon", &command.tenant_id, &command.request_no])
}

fn claim_coupon_no(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&["claim-coupon-no", &command.tenant_id, &command.request_no])
}

fn claim_coupon_ledger_entry_id(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&[
        "promotion-coupon-claim-ledger-entry",
        &command.tenant_id,
        &command.request_no,
    ])
}

fn claim_coupon_ledger_no(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&[
        "promotion-coupon-claim-ledger",
        &command.tenant_id,
        &command.request_no,
    ])
}

fn issued_claim_coupon_code(command: &ClaimPromotionUserCouponCommand) -> String {
    stable_storage_id(&["CL", &command.request_no])
}

fn coupon_credit_points(discount_value: &str) -> Result<i64, CommerceServiceError> {
    let cents = money_cents(discount_value)?;
    if cents <= 0 {
        Ok(0)
    } else {
        Ok((cents / 10).max(1))
    }
}

fn money_cents(value: &str) -> Result<i64, CommerceServiceError> {
    let normalized = value.trim();
    if normalized.is_empty() || normalized.starts_with('-') || normalized.starts_with('+') {
        return Err(CommerceServiceError::storage(format!(
            "invalid commerce money amount: {value}"
        )));
    }
    let mut parts = normalized.split('.');
    let integer = parts.next().unwrap_or_default();
    let fraction = parts.next();
    if parts.next().is_some()
        || integer.is_empty()
        || !integer.chars().all(|character| character.is_ascii_digit())
    {
        return Err(CommerceServiceError::storage(format!(
            "invalid commerce money amount: {value}"
        )));
    }
    let integer_value = integer.parse::<i64>().map_err(|_| {
        CommerceServiceError::storage(format!("invalid commerce money amount: {value}"))
    })?;
    let integer_cents = integer_value.checked_mul(100).ok_or_else(|| {
        CommerceServiceError::storage(format!("commerce money amount is too large: {value}"))
    })?;
    let fraction_cents = match fraction {
        Some(fraction) => {
            if fraction.is_empty()
                || fraction.len() > 2
                || !fraction.chars().all(|character| character.is_ascii_digit())
            {
                return Err(CommerceServiceError::storage(format!(
                    "invalid commerce money amount: {value}"
                )));
            }
            let padded = if fraction.len() == 1 {
                format!("{fraction}0")
            } else {
                fraction.to_string()
            };
            padded.parse::<i64>().map_err(|_| {
                CommerceServiceError::storage(format!("invalid commerce money amount: {value}"))
            })?
        }
        None => 0,
    };
    integer_cents.checked_add(fraction_cents).ok_or_else(|| {
        CommerceServiceError::storage(format!("commerce money amount is too large: {value}"))
    })
}

fn checked_points_add(left: i64, right: i64) -> Result<i64, CommerceServiceError> {
    left.checked_add(right)
        .ok_or_else(|| CommerceServiceError::storage("promotion points balance overflow"))
}

fn promotion_requires_stock_quantity(promotion: &RedeemPromotion) -> bool {
    promotion.total_quantity.is_some() || promotion.stock_type.trim() != "unlimited"
}

fn coupon_status_label(value: &str) -> Result<&'static str, CommerceServiceError> {
    match value.trim().to_ascii_lowercase().as_str() {
        "redeemed" | "used" => Ok("success"),
        "claimable" | "claimed" | "issued" | "active" | "draft" => Ok("pending"),
        "expired" | "disabled" | "voided" | "cancelled" => Ok("failed"),
        status => Err(CommerceServiceError::storage(format!(
            "unsupported billing coupon status: {status}"
        ))),
    }
}

fn points_direction(value: &str) -> &'static str {
    match value.trim().to_ascii_lowercase().as_str() {
        "credit" => "in",
        "debit" => "out",
        _ => "unknown",
    }
}

fn points_business_type(value: &str) -> &'static str {
    match value.trim().to_ascii_lowercase().as_str() {
        "redeem" => "redeem",
        "recharge" => "recharge",
        "transfer" => "transfer",
        "exchange" => "exchange",
        _ => "adjustment",
    }
}

fn points_to_money_string(points: i64) -> String {
    let cents = i128::from(points) * 10;
    format!("{}.{:02}", cents / 100, cents % 100)
}

fn stable_storage_id(parts: &[&str]) -> String {
    // 用 ':' 作为 join 分隔符：sanitization 只保留字母数字与 '-_.'，
    // ':' 会被替换为 '-'，因此清理后的各部分永远不会包含 ':'，join 无歧义、零碰撞。
    parts
        .iter()
        .map(|part| {
            part.chars()
                .map(|character| {
                    if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.') {
                        character
                    } else {
                        '-'
                    }
                })
                .collect::<String>()
        })
        .collect::<Vec<_>>()
        .join(":")
}

fn account_id(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&[
        "account",
        &command.tenant_id,
        command.organization_id.as_deref().unwrap_or("global"),
        &command.owner_user_id,
        "points",
        POINTS_CURRENCY_CODE,
    ])
}

fn coupon_id(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&["coupon", &command.tenant_id, &command.request_no])
}

fn coupon_no(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&["coupon-no", &command.tenant_id, &command.request_no])
}

fn coupon_ledger_entry_id(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&[
        "promotion-coupon-ledger-entry",
        &command.tenant_id,
        &command.request_no,
    ])
}

fn coupon_ledger_no(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&[
        "promotion-coupon-ledger",
        &command.tenant_id,
        &command.request_no,
    ])
}

fn ledger_entry_id(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&["ledger", &command.tenant_id, &command.request_no])
}

fn issued_coupon_code(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&["CP", &command.request_no])
}

fn redeem_idempotency_id(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&[
        "idem",
        &command.tenant_id,
        PROMOTION_CODE_REDEMPTION_SCOPE,
        &command.idempotency_key,
    ])
}

fn redeem_request_hash(command: &PromotionCodeRedemptionCommand) -> String {
    stable_storage_id(&[
        "redeem",
        &command.tenant_id,
        command.organization_id.as_deref().unwrap_or("global"),
        &command.owner_user_id,
        &command.code,
        &command.request_no,
    ])
}

fn optional_string_cell(row: &sqlx::postgres::PgRow, column: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(column).ok().flatten()
}

fn string_cell(row: &sqlx::postgres::PgRow, column: &str) -> String {
    optional_string_cell(row, column).unwrap_or_default()
}

fn required_status_cell(
    row: &sqlx::postgres::PgRow,
    column: &str,
    source: &str,
) -> Result<String, CommerceServiceError> {
    let value = string_cell(row, column);
    if value.trim().is_empty() {
        Err(missing_billing_status_error(source))
    } else {
        Ok(value)
    }
}

fn missing_billing_status_error(source: &str) -> CommerceServiceError {
    let message = match source {
        "redeem" => "missing billing redeem status from database row".to_owned(),
        source => format!("missing billing {source} status from database row"),
    };
    CommerceServiceError::storage(message)
}

fn integer_cell(row: &sqlx::postgres::PgRow, column: &str) -> i64 {
    row.try_get::<i64, _>(column)
        .or_else(|_| row.try_get::<i32, _>(column).map(i64::from))
        .unwrap_or(0)
}

fn optional_integer_cell(row: &sqlx::postgres::PgRow, column: &str) -> Option<i64> {
    row.try_get::<Option<i64>, _>(column)
        .or_else(|_| {
            row.try_get::<Option<i32>, _>(column)
                .map(|value| value.map(i64::from))
        })
        .ok()
        .flatten()
}

fn store_error(context: &str, error: sqlx::Error) -> CommerceServiceError {
    CommerceServiceError::storage(format!("{context}: {error}"))
}

fn current_timestamp_string() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0);
    format_unix_timestamp(seconds)
}

/// 幂等锁的有效期（秒）。持有锁的请求必须在此时间内完成，否则视为崩溃残留，允许后续请求抢占。
const IDEMPOTENCY_LOCK_TTL_SECONDS: i64 = 60;

/// 幂等记录的整体过期时间（秒）。超过此时间的记录视为历史遗留，可被清理。
const IDEMPOTENCY_RECORD_TTL_SECONDS: i64 = 86_400;

/// 基于当前时间戳计算锁过期时间字符串。
fn lock_expiry_timestamp(now: &str) -> String {
    timestamp_after_seconds(now, IDEMPOTENCY_LOCK_TTL_SECONDS)
}

/// 基于当前时间戳计算记录过期时间字符串。
fn record_expiry_timestamp(now: &str) -> String {
    timestamp_after_seconds(now, IDEMPOTENCY_RECORD_TTL_SECONDS)
}

/// 将 "YYYY-MM-DD HH:MM:SS" 格式时间戳加指定秒数，返回同格式字符串。
fn timestamp_after_seconds(now: &str, seconds: i64) -> String {
    let total = parse_unix_timestamp(now).saturating_add(seconds);
    format_unix_timestamp(total)
}

/// 将 "YYYY-MM-DD HH:MM:SS" 格式时间戳解析为 unix 秒。
fn parse_unix_timestamp(value: &str) -> i64 {
    let parts: Vec<&str> = value.split_whitespace().collect();
    if parts.len() != 2 {
        return 0;
    }
    let date_parts: Vec<i64> = parts[0].split('-').filter_map(|s| s.parse().ok()).collect();
    let time_parts: Vec<i64> = parts[1].split(':').filter_map(|s| s.parse().ok()).collect();
    if date_parts.len() != 3 || time_parts.len() != 3 {
        return 0;
    }
    let days = days_from_civil(date_parts[0], date_parts[1], date_parts[2]);
    let secs = days * 86_400 + time_parts[0] * 3_600 + time_parts[1] * 60 + time_parts[2];
    secs
}

fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let y = if month <= 2 { year - 1 } else { year };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let doy = (153 * (if month > 2 { month - 3 } else { month + 9 }) + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

fn format_unix_timestamp(seconds: i64) -> String {
    let days = seconds.div_euclid(86_400);
    let seconds_of_day = seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    format!("{year:04}-{month:02}-{day:02} {hour:02}:{minute:02}:{second:02}")
}

fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let days = days + 719_468;
    let era = if days >= 0 { days } else { days - 146_096 } / 146_097;
    let day_of_era = days - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    let year = year + if month <= 2 { 1 } else { 0 };
    (year, month, day)
}

#[cfg(test)]
mod tests {
    #[test]
    fn postgres_promotion_redeem_updates_use_atomic_guards() {
        let source = include_str!("postgres_promotion.rs");
        let stock_update = source
            .split("UPDATE promotion_coupon_stock")
            .nth(1)
            .expect("promotion stock update");
        let account_update = source
            .split("UPDATE commerce_account")
            .nth(1)
            .expect("commerce account update");

        assert!(stock_update.contains("available_quantity > 0"));
        assert!(stock_update.contains("stock_update.rows_affected() != 1"));
        assert!(source.contains("code_update.rows_affected() != 1"));
        assert!(account_update.contains("available_amount::bigint = $4"));
        assert!(source.contains("account_update.rows_affected() != 1"));
    }
}
