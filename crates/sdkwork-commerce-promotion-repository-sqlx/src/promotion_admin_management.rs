use chrono::Utc;
use sdkwork_commerce_promotion_service::{
    PromotionAdminListQuery, PromotionAdminPage, PromotionAdminScope, PromotionAdminUserCouponItem,
    PromotionCampaignInput, PromotionCampaignItem, PromotionCodeBatchInput, PromotionCodeBatchItem,
    PromotionCouponLedgerItem, PromotionCouponStockInput, PromotionCouponStockItem,
    PromotionDistributionInput, PromotionDistributionTaskItem, PromotionOfferInput,
    PromotionOfferItem,
};
use sdkwork_contract_service::CommerceServiceError;
use sqlx::{PgPool, Row, SqlitePool};
use uuid::Uuid;

use crate::promotion_admin::AdminPool;

const CAMPAIGN_COLUMNS: &str = "id, campaign_no, campaign_code, display_name, description, channel_scope, audience_scope, CAST(starts_at AS TEXT) AS starts_at, CAST(ends_at AS TEXT) AS ends_at, status, version, CAST(updated_at AS TEXT) AS updated_at";
const OFFER_COLUMNS: &str = "o.id, o.campaign_id, o.offer_no, o.offer_code, o.offer_type, o.display_name, o.description, o.priority, CAST(o.starts_at AS TEXT) AS starts_at, CAST(o.ends_at AS TEXT) AS ends_at, o.status, v.discount_type, CAST(v.discount_value AS TEXT) AS discount_value, CAST(v.minimum_amount AS TEXT) AS minimum_amount, CAST(v.maximum_discount_amount AS TEXT) AS maximum_discount_amount, v.currency_code, o.version, CAST(o.updated_at AS TEXT) AS updated_at";

pub(crate) async fn list_campaigns(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionCampaignItem>, CommerceServiceError> {
    let search = query.search_pattern();
    let (total_items, rows) = match pool {
        AdminPool::Postgres(pool) => {
            let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM promotion_campaign WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(display_name) LIKE $3 OR LOWER(COALESCE(campaign_code, '')) LIKE $3 OR LOWER(campaign_no) LIKE $3)")
                .bind(scope.tenant_id).bind(scope.organization_id).bind(&search)
                .fetch_one(pool).await.map_err(|error| storage("list campaigns", error))?;
            let sql = format!("SELECT {CAMPAIGN_COLUMNS} FROM promotion_campaign WHERE tenant_id = $1 AND organization_id = $2 AND ($3 = '%%' OR LOWER(display_name) LIKE $3 OR LOWER(COALESCE(campaign_code, '')) LIKE $3 OR LOWER(campaign_no) LIKE $3) ORDER BY created_at DESC LIMIT $4 OFFSET $5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list campaigns", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Postgres)
                    .collect::<Vec<_>>(),
            )
        }
        AdminPool::Sqlite(pool) => {
            let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM promotion_campaign WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(display_name) LIKE ?3 OR LOWER(COALESCE(campaign_code, '')) LIKE ?3 OR LOWER(campaign_no) LIKE ?3)")
                .bind(scope.tenant_id).bind(scope.organization_id).bind(&search)
                .fetch_one(pool).await.map_err(|error| storage("list campaigns", error))?;
            let sql = format!("SELECT {CAMPAIGN_COLUMNS} FROM promotion_campaign WHERE tenant_id = ?1 AND organization_id = ?2 AND (?3 = '%%' OR LOWER(display_name) LIKE ?3 OR LOWER(COALESCE(campaign_code, '')) LIKE ?3 OR LOWER(campaign_no) LIKE ?3) ORDER BY created_at DESC LIMIT ?4 OFFSET ?5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list campaigns", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Sqlite)
                    .collect::<Vec<_>>(),
            )
        }
    };
    Ok(PromotionAdminPage {
        items: rows
            .into_iter()
            .map(map_campaign)
            .collect::<Result<_, _>>()?,
        total_items,
    })
}

pub(crate) async fn retrieve_campaign(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    campaign_id: i64,
) -> Result<Option<PromotionCampaignItem>, CommerceServiceError> {
    let row = match pool {
        AdminPool::Postgres(pool) => {
            let sql = format!("SELECT {CAMPAIGN_COLUMNS} FROM promotion_campaign WHERE id = $1 AND tenant_id = $2 AND organization_id = $3");
            sqlx::query(&sql)
                .bind(campaign_id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve campaign", error))?
                .map(ManagementRow::Postgres)
        }
        AdminPool::Sqlite(pool) => {
            let sql = format!("SELECT {CAMPAIGN_COLUMNS} FROM promotion_campaign WHERE id = ?1 AND tenant_id = ?2 AND organization_id = ?3");
            sqlx::query(&sql)
                .bind(campaign_id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve campaign", error))?
                .map(ManagementRow::Sqlite)
        }
    };
    row.map(map_campaign).transpose()
}

pub(crate) async fn create_campaign(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    input: &PromotionCampaignInput,
) -> Result<PromotionCampaignItem, CommerceServiceError> {
    let id = generated_id();
    let uuid = Uuid::new_v4().to_string();
    let campaign_no = reference("CAM");
    let actor_id = scope.actor_id()?;
    match pool {
        AdminPool::Postgres(pool) => {
            sqlx::query("INSERT INTO promotion_campaign (id, uuid, tenant_id, organization_id, campaign_no, campaign_code, display_name, description, channel_scope, audience_scope, starts_at, ends_at, status, version, created_by, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CAST($11 AS TIMESTAMPTZ),CAST($12 AS TIMESTAMPTZ),$13,0,$14,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
                .bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(campaign_no).bind(trimmed(&input.campaign_code)).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.channel_scope.trim()).bind(input.audience_scope.trim()).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status.trim()).bind(actor_id)
                .execute(pool).await.map_err(|error| storage("create campaign", error))?;
        }
        AdminPool::Sqlite(pool) => {
            sqlx::query("INSERT INTO promotion_campaign (id, uuid, tenant_id, organization_id, campaign_no, campaign_code, display_name, description, channel_scope, audience_scope, starts_at, ends_at, status, version, created_by, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,0,?14,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
                .bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(campaign_no).bind(trimmed(&input.campaign_code)).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.channel_scope.trim()).bind(input.audience_scope.trim()).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status.trim()).bind(actor_id)
                .execute(pool).await.map_err(|error| storage("create campaign", error))?;
        }
    }
    retrieve_campaign(pool, scope, id)
        .await?
        .ok_or_else(|| CommerceServiceError::storage("created campaign was not found"))
}

pub(crate) async fn update_campaign(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    campaign_id: i64,
    input: &PromotionCampaignInput,
) -> Result<Option<PromotionCampaignItem>, CommerceServiceError> {
    let version = input.version.expect("validated campaign version");
    let affected = match pool {
        AdminPool::Postgres(pool) => sqlx::query("UPDATE promotion_campaign SET campaign_code=$1, display_name=$2, description=$3, channel_scope=$4, audience_scope=$5, starts_at=CAST($6 AS TIMESTAMPTZ), ends_at=CAST($7 AS TIMESTAMPTZ), status=$8, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=$9 AND tenant_id=$10 AND organization_id=$11 AND version=$12 AND status NOT IN ('ENDED','CANCELLED','ARCHIVED')")
            .bind(trimmed(&input.campaign_code)).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.channel_scope.trim()).bind(input.audience_scope.trim()).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status.trim()).bind(campaign_id).bind(scope.tenant_id).bind(scope.organization_id).bind(version)
            .execute(pool).await.map_err(|error| storage("update campaign", error))?.rows_affected(),
        AdminPool::Sqlite(pool) => sqlx::query("UPDATE promotion_campaign SET campaign_code=?1, display_name=?2, description=?3, channel_scope=?4, audience_scope=?5, starts_at=?6, ends_at=?7, status=?8, version=version+1, updated_at=CURRENT_TIMESTAMP WHERE id=?9 AND tenant_id=?10 AND organization_id=?11 AND version=?12 AND status NOT IN ('ENDED','CANCELLED','ARCHIVED')")
            .bind(trimmed(&input.campaign_code)).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.channel_scope.trim()).bind(input.audience_scope.trim()).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status.trim()).bind(campaign_id).bind(scope.tenant_id).bind(scope.organization_id).bind(version)
            .execute(pool).await.map_err(|error| storage("update campaign", error))?.rows_affected(),
    };
    if affected == 0 {
        return Ok(None);
    }
    retrieve_campaign(pool, scope, campaign_id).await
}

pub(crate) async fn delete_campaign(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    campaign_id: i64,
) -> Result<bool, CommerceServiceError> {
    let affected = match pool {
        AdminPool::Postgres(pool) => sqlx::query("DELETE FROM promotion_campaign c WHERE c.id=$1 AND c.tenant_id=$2 AND c.organization_id=$3 AND c.status='DRAFT' AND NOT EXISTS (SELECT 1 FROM promotion_offer o WHERE o.tenant_id=c.tenant_id AND o.campaign_id=c.id)").bind(campaign_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await.map_err(|error| storage("delete campaign", error))?.rows_affected(),
        AdminPool::Sqlite(pool) => sqlx::query("DELETE FROM promotion_campaign WHERE id=?1 AND tenant_id=?2 AND organization_id=?3 AND status='DRAFT' AND NOT EXISTS (SELECT 1 FROM promotion_offer o WHERE o.tenant_id=promotion_campaign.tenant_id AND o.campaign_id=promotion_campaign.id)").bind(campaign_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await.map_err(|error| storage("delete campaign", error))?.rows_affected(),
    };
    Ok(affected == 1)
}

pub(crate) async fn retrieve_offer(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
) -> Result<Option<PromotionOfferItem>, CommerceServiceError> {
    let row = match pool {
        AdminPool::Postgres(pool) => retrieve_offer_postgres(pool, scope, offer_id)
            .await?
            .map(ManagementRow::Postgres),
        AdminPool::Sqlite(pool) => retrieve_offer_sqlite(pool, scope, offer_id)
            .await?
            .map(ManagementRow::Sqlite),
    };
    row.map(map_offer).transpose()
}

pub(crate) async fn create_offer(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    input: &PromotionOfferInput,
) -> Result<PromotionOfferItem, CommerceServiceError> {
    let offer_id = generated_id();
    let version_id = generated_id();
    let offer_uuid = Uuid::new_v4().to_string();
    let version_uuid = Uuid::new_v4().to_string();
    let offer_no = reference("OFR");
    match pool {
        AdminPool::Postgres(pool) => {
            create_offer_postgres(
                pool,
                scope,
                input,
                offer_id,
                version_id,
                &offer_uuid,
                &version_uuid,
                &offer_no,
            )
            .await?
        }
        AdminPool::Sqlite(pool) => {
            create_offer_sqlite(
                pool,
                scope,
                input,
                offer_id,
                version_id,
                &offer_uuid,
                &version_uuid,
                &offer_no,
            )
            .await?
        }
    }
    retrieve_offer(pool, scope, offer_id)
        .await?
        .ok_or_else(|| CommerceServiceError::storage("created offer was not found"))
}

pub(crate) async fn update_offer(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
    input: &PromotionOfferInput,
) -> Result<Option<PromotionOfferItem>, CommerceServiceError> {
    let version_id = generated_id();
    let version_uuid = Uuid::new_v4().to_string();
    let affected = match pool {
        AdminPool::Postgres(pool) => {
            update_offer_postgres(pool, scope, offer_id, input, version_id, &version_uuid).await?
        }
        AdminPool::Sqlite(pool) => {
            update_offer_sqlite(pool, scope, offer_id, input, version_id, &version_uuid).await?
        }
    };
    if !affected {
        return Ok(None);
    }
    retrieve_offer(pool, scope, offer_id).await
}

pub(crate) async fn delete_offer(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
) -> Result<bool, CommerceServiceError> {
    let affected = match pool {
        AdminPool::Postgres(pool) => sqlx::query("DELETE FROM promotion_offer o WHERE o.id=$1 AND o.tenant_id=$2 AND o.organization_id=$3 AND o.status=0 AND NOT EXISTS (SELECT 1 FROM promotion_coupon_stock s WHERE s.tenant_id=o.tenant_id AND s.offer_id=o.id)").bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await.map_err(|error| storage("delete offer", error))?.rows_affected(),
        AdminPool::Sqlite(pool) => sqlx::query("DELETE FROM promotion_offer WHERE id=?1 AND tenant_id=?2 AND organization_id=?3 AND status=0 AND NOT EXISTS (SELECT 1 FROM promotion_coupon_stock s WHERE s.tenant_id=promotion_offer.tenant_id AND s.offer_id=promotion_offer.id)").bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).execute(pool).await.map_err(|error| storage("delete offer", error))?.rows_affected(),
    };
    Ok(affected == 1)
}

pub(crate) async fn create_coupon_stock(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    input: &PromotionCouponStockInput,
) -> Result<PromotionCouponStockItem, CommerceServiceError> {
    let id = generated_id();
    let uuid = Uuid::new_v4().to_string();
    let stock_no = reference("STK");
    match pool {
        AdminPool::Postgres(pool) => {
            let version_id = sqlx::query_scalar::<_, Option<i64>>("SELECT current_offer_version_id FROM promotion_offer WHERE id=$1 AND tenant_id=$2 AND organization_id=$3").bind(input.offer_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(pool).await.map_err(|error| storage("resolve offer version", error))?.flatten().ok_or_else(|| CommerceServiceError::not_found("promotion offer not found"))?;
            sqlx::query("INSERT INTO promotion_coupon_stock (id,uuid,tenant_id,organization_id,offer_id,offer_version_id,stock_no,stock_type,total_quantity,available_quantity,claimed_quantity,redeemed_quantity,locked_quantity,per_user_limit,claim_starts_at,claim_ends_at,status,version,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,0,0,0,$10,CAST($11 AS TIMESTAMPTZ),CAST($12 AS TIMESTAMPTZ),$13,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.offer_id).bind(version_id).bind(stock_no).bind(input.stock_type.trim()).bind(input.total_quantity).bind(input.per_user_limit).bind(trimmed(&input.claim_starts_at)).bind(trimmed(&input.claim_ends_at)).bind(input.status).execute(pool).await.map_err(|error| storage("create coupon stock", error))?;
        }
        AdminPool::Sqlite(pool) => {
            let version_id = sqlx::query_scalar::<_, Option<i64>>("SELECT current_offer_version_id FROM promotion_offer WHERE id=?1 AND tenant_id=?2 AND organization_id=?3").bind(input.offer_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(pool).await.map_err(|error| storage("resolve offer version", error))?.flatten().ok_or_else(|| CommerceServiceError::not_found("promotion offer not found"))?;
            sqlx::query("INSERT INTO promotion_coupon_stock (id,uuid,tenant_id,organization_id,offer_id,offer_version_id,stock_no,stock_type,total_quantity,available_quantity,claimed_quantity,redeemed_quantity,locked_quantity,per_user_limit,claim_starts_at,claim_ends_at,status,version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9,0,0,0,?10,?11,?12,?13,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.offer_id).bind(version_id).bind(stock_no).bind(input.stock_type.trim()).bind(input.total_quantity).bind(input.per_user_limit).bind(trimmed(&input.claim_starts_at)).bind(trimmed(&input.claim_ends_at)).bind(input.status).execute(pool).await.map_err(|error| storage("create coupon stock", error))?;
        }
    }
    retrieve_stock(pool, scope, id)
        .await?
        .ok_or_else(|| CommerceServiceError::storage("created coupon stock was not found"))
}

async fn retrieve_offer_postgres(
    pool: &PgPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
) -> Result<Option<sqlx::postgres::PgRow>, CommerceServiceError> {
    let sql = format!("SELECT {OFFER_COLUMNS} FROM promotion_offer o LEFT JOIN promotion_offer_version v ON v.id=o.current_offer_version_id AND v.tenant_id=o.tenant_id WHERE o.id=$1 AND o.tenant_id=$2 AND o.organization_id=$3");
    sqlx::query(&sql)
        .bind(offer_id)
        .bind(scope.tenant_id)
        .bind(scope.organization_id)
        .fetch_optional(pool)
        .await
        .map_err(|error| storage("retrieve offer", error))
}

async fn retrieve_offer_sqlite(
    pool: &SqlitePool,
    scope: &PromotionAdminScope,
    offer_id: i64,
) -> Result<Option<sqlx::sqlite::SqliteRow>, CommerceServiceError> {
    let sql = format!("SELECT {OFFER_COLUMNS} FROM promotion_offer o LEFT JOIN promotion_offer_version v ON v.id=o.current_offer_version_id AND v.tenant_id=o.tenant_id WHERE o.id=?1 AND o.tenant_id=?2 AND o.organization_id=?3");
    sqlx::query(&sql)
        .bind(offer_id)
        .bind(scope.tenant_id)
        .bind(scope.organization_id)
        .fetch_optional(pool)
        .await
        .map_err(|error| storage("retrieve offer", error))
}

async fn create_offer_postgres(
    pool: &PgPool,
    scope: &PromotionAdminScope,
    input: &PromotionOfferInput,
    offer_id: i64,
    version_id: i64,
    offer_uuid: &str,
    version_uuid: &str,
    offer_no: &str,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin create offer", error))?;
    validate_campaign_reference_postgres(&mut tx, scope, input.campaign_id).await?;
    sqlx::query("INSERT INTO promotion_offer (id,uuid,tenant_id,organization_id,campaign_id,offer_no,offer_code,offer_type,audience_scope,combinability,priority,goods_scope,current_offer_version_id,display_name,description,starts_at,ends_at,status,version,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CAST($16 AS TIMESTAMPTZ),CAST($17 AS TIMESTAMPTZ),$18,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
        .bind(offer_id).bind(offer_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.campaign_id).bind(offer_no).bind(trimmed(&input.offer_code)).bind(input.offer_type.trim()).bind(input.audience_scope.trim()).bind(input.combinability.trim()).bind(input.priority).bind(input.goods_scope.trim()).bind(version_id).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status)
        .execute(&mut *tx).await.map_err(|error| storage("insert offer", error))?;
    insert_offer_version_postgres(
        &mut tx,
        scope.tenant_id,
        offer_id,
        version_id,
        version_uuid,
        1,
        input,
    )
    .await?;
    tx.commit()
        .await
        .map_err(|error| storage("commit create offer", error))
}

async fn create_offer_sqlite(
    pool: &SqlitePool,
    scope: &PromotionAdminScope,
    input: &PromotionOfferInput,
    offer_id: i64,
    version_id: i64,
    offer_uuid: &str,
    version_uuid: &str,
    offer_no: &str,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin create offer", error))?;
    validate_campaign_reference_sqlite(&mut tx, scope, input.campaign_id).await?;
    sqlx::query("INSERT INTO promotion_offer (id,uuid,tenant_id,organization_id,campaign_id,offer_no,offer_code,offer_type,audience_scope,combinability,priority,goods_scope,current_offer_version_id,display_name,description,starts_at,ends_at,status,version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
        .bind(offer_id).bind(offer_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.campaign_id).bind(offer_no).bind(trimmed(&input.offer_code)).bind(input.offer_type.trim()).bind(input.audience_scope.trim()).bind(input.combinability.trim()).bind(input.priority).bind(input.goods_scope.trim()).bind(version_id).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status)
        .execute(&mut *tx).await.map_err(|error| storage("insert offer", error))?;
    insert_offer_version_sqlite(
        &mut tx,
        scope.tenant_id,
        offer_id,
        version_id,
        version_uuid,
        1,
        input,
    )
    .await?;
    tx.commit()
        .await
        .map_err(|error| storage("commit create offer", error))
}

async fn update_offer_postgres(
    pool: &PgPool,
    scope: &PromotionAdminScope,
    offer_id: i64,
    input: &PromotionOfferInput,
    version_id: i64,
    version_uuid: &str,
) -> Result<bool, CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin update offer", error))?;
    validate_campaign_reference_postgres(&mut tx, scope, input.campaign_id).await?;
    let version_no = sqlx::query_scalar::<_, i32>("SELECT COALESCE(MAX(version_no),0)+1 FROM promotion_offer_version WHERE tenant_id=$1 AND offer_id=$2").bind(scope.tenant_id).bind(offer_id).fetch_one(&mut *tx).await.map_err(|error| storage("resolve offer version", error))?;
    let affected = sqlx::query("UPDATE promotion_offer SET campaign_id=$1,offer_code=$2,offer_type=$3,audience_scope=$4,combinability=$5,priority=$6,goods_scope=$7,current_offer_version_id=$8,display_name=$9,description=$10,starts_at=CAST($11 AS TIMESTAMPTZ),ends_at=CAST($12 AS TIMESTAMPTZ),status=$13,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$14 AND tenant_id=$15 AND organization_id=$16 AND version=$17")
        .bind(input.campaign_id).bind(trimmed(&input.offer_code)).bind(input.offer_type.trim()).bind(input.audience_scope.trim()).bind(input.combinability.trim()).bind(input.priority).bind(input.goods_scope.trim()).bind(version_id).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status).bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).bind(input.version.expect("validated offer version"))
        .execute(&mut *tx).await.map_err(|error| storage("update offer", error))?.rows_affected();
    if affected == 0 {
        tx.rollback()
            .await
            .map_err(|error| storage("rollback update offer", error))?;
        return Ok(false);
    }
    insert_offer_version_postgres(
        &mut tx,
        scope.tenant_id,
        offer_id,
        version_id,
        version_uuid,
        version_no,
        input,
    )
    .await?;
    tx.commit()
        .await
        .map_err(|error| storage("commit update offer", error))?;
    Ok(true)
}

async fn update_offer_sqlite(
    pool: &SqlitePool,
    scope: &PromotionAdminScope,
    offer_id: i64,
    input: &PromotionOfferInput,
    version_id: i64,
    version_uuid: &str,
) -> Result<bool, CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin update offer", error))?;
    validate_campaign_reference_sqlite(&mut tx, scope, input.campaign_id).await?;
    let version_no = sqlx::query_scalar::<_, i32>("SELECT COALESCE(MAX(version_no),0)+1 FROM promotion_offer_version WHERE tenant_id=?1 AND offer_id=?2").bind(scope.tenant_id).bind(offer_id).fetch_one(&mut *tx).await.map_err(|error| storage("resolve offer version", error))?;
    let affected = sqlx::query("UPDATE promotion_offer SET campaign_id=?1,offer_code=?2,offer_type=?3,audience_scope=?4,combinability=?5,priority=?6,goods_scope=?7,current_offer_version_id=?8,display_name=?9,description=?10,starts_at=?11,ends_at=?12,status=?13,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?14 AND tenant_id=?15 AND organization_id=?16 AND version=?17")
        .bind(input.campaign_id).bind(trimmed(&input.offer_code)).bind(input.offer_type.trim()).bind(input.audience_scope.trim()).bind(input.combinability.trim()).bind(input.priority).bind(input.goods_scope.trim()).bind(version_id).bind(input.display_name.trim()).bind(trimmed(&input.description)).bind(input.starts_at.trim()).bind(trimmed(&input.ends_at)).bind(input.status).bind(offer_id).bind(scope.tenant_id).bind(scope.organization_id).bind(input.version.expect("validated offer version"))
        .execute(&mut *tx).await.map_err(|error| storage("update offer", error))?.rows_affected();
    if affected == 0 {
        tx.rollback()
            .await
            .map_err(|error| storage("rollback update offer", error))?;
        return Ok(false);
    }
    insert_offer_version_sqlite(
        &mut tx,
        scope.tenant_id,
        offer_id,
        version_id,
        version_uuid,
        version_no,
        input,
    )
    .await?;
    tx.commit()
        .await
        .map_err(|error| storage("commit update offer", error))?;
    Ok(true)
}

async fn validate_campaign_reference_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &PromotionAdminScope,
    campaign_id: Option<i64>,
) -> Result<(), CommerceServiceError> {
    if let Some(id) = campaign_id {
        let exists = sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM promotion_campaign WHERE id=$1 AND tenant_id=$2 AND organization_id=$3)").bind(id).bind(scope.tenant_id).bind(scope.organization_id).fetch_one(&mut **tx).await.map_err(|error| storage("validate campaign", error))?;
        if !exists {
            return Err(CommerceServiceError::not_found(
                "promotion campaign not found",
            ));
        }
    }
    Ok(())
}

async fn validate_campaign_reference_sqlite(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    scope: &PromotionAdminScope,
    campaign_id: Option<i64>,
) -> Result<(), CommerceServiceError> {
    if let Some(id) = campaign_id {
        let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM promotion_campaign WHERE id=?1 AND tenant_id=?2 AND organization_id=?3").bind(id).bind(scope.tenant_id).bind(scope.organization_id).fetch_one(&mut **tx).await.map_err(|error| storage("validate campaign", error))?;
        if count == 0 {
            return Err(CommerceServiceError::not_found(
                "promotion campaign not found",
            ));
        }
    }
    Ok(())
}

async fn insert_offer_version_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: i64,
    offer_id: i64,
    version_id: i64,
    uuid: &str,
    version_no: i32,
    input: &PromotionOfferInput,
) -> Result<(), CommerceServiceError> {
    sqlx::query("INSERT INTO promotion_offer_version (id,uuid,tenant_id,offer_id,version_no,discount_type,discount_value,minimum_amount,maximum_discount_amount,maximum_quantity_per_order,currency_code,rule_json,stack_rule_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,CAST($7 AS NUMERIC),CAST($8 AS NUMERIC),CAST($9 AS NUMERIC),1,$10,NULL,NULL,CURRENT_TIMESTAMP)")
        .bind(version_id).bind(uuid).bind(tenant_id).bind(offer_id).bind(version_no).bind(input.discount_type.trim()).bind(input.discount_value.trim()).bind(input.minimum_amount.trim()).bind(trimmed(&input.maximum_discount_amount)).bind(input.currency_code.trim())
        .execute(&mut **tx).await.map_err(|error| storage("insert offer version", error))?;
    Ok(())
}

async fn insert_offer_version_sqlite(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    tenant_id: i64,
    offer_id: i64,
    version_id: i64,
    uuid: &str,
    version_no: i32,
    input: &PromotionOfferInput,
) -> Result<(), CommerceServiceError> {
    sqlx::query("INSERT INTO promotion_offer_version (id,uuid,tenant_id,offer_id,version_no,discount_type,discount_value,minimum_amount,maximum_discount_amount,maximum_quantity_per_order,currency_code,rule_json,stack_rule_json,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,1,?10,NULL,NULL,CURRENT_TIMESTAMP)")
        .bind(version_id).bind(uuid).bind(tenant_id).bind(offer_id).bind(version_no).bind(input.discount_type.trim()).bind(input.discount_value.trim()).bind(input.minimum_amount.trim()).bind(trimmed(&input.maximum_discount_amount)).bind(input.currency_code.trim())
        .execute(&mut **tx).await.map_err(|error| storage("insert offer version", error))?;
    Ok(())
}

async fn retrieve_stock(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    stock_id: i64,
) -> Result<Option<PromotionCouponStockItem>, CommerceServiceError> {
    let columns = "id,offer_id,stock_no,stock_type,total_quantity,available_quantity,claimed_quantity,redeemed_quantity,locked_quantity,per_user_limit,CAST(claim_starts_at AS TEXT) AS claim_starts_at,CAST(claim_ends_at AS TEXT) AS claim_ends_at,status";
    let row = match pool {
        AdminPool::Postgres(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_coupon_stock WHERE id=$1 AND tenant_id=$2 AND organization_id=$3");
            sqlx::query(&sql)
                .bind(stock_id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve stock", error))?
                .map(ManagementRow::Postgres)
        }
        AdminPool::Sqlite(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_coupon_stock WHERE id=?1 AND tenant_id=?2 AND organization_id=?3");
            sqlx::query(&sql)
                .bind(stock_id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve stock", error))?
                .map(ManagementRow::Sqlite)
        }
    };
    row.map(map_stock).transpose()
}

pub(crate) async fn list_code_batches(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionCodeBatchItem>, CommerceServiceError> {
    let search = query.search_pattern();
    let columns = "id,stock_id,offer_id,batch_no,code_type,requested_quantity,generated_quantity,code_length,code_prefix,CAST(starts_at AS TEXT) AS starts_at,CAST(expires_at AS TEXT) AS expires_at,status,CAST(created_at AS TEXT) AS created_at";
    let (total_items, rows) = match pool {
        AdminPool::Postgres(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_code_batch WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(batch_no) LIKE $3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list code batches",error))?;
            let sql=format!("SELECT {columns} FROM promotion_code_batch WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(batch_no) LIKE $3) ORDER BY created_at DESC LIMIT $4 OFFSET $5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list code batches", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Postgres)
                    .collect::<Vec<_>>(),
            )
        }
        AdminPool::Sqlite(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_code_batch WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(batch_no) LIKE ?3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list code batches",error))?;
            let sql=format!("SELECT {columns} FROM promotion_code_batch WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(batch_no) LIKE ?3) ORDER BY created_at DESC LIMIT ?4 OFFSET ?5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list code batches", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Sqlite)
                    .collect::<Vec<_>>(),
            )
        }
    };
    Ok(PromotionAdminPage {
        items: rows
            .into_iter()
            .map(map_code_batch)
            .collect::<Result<_, _>>()?,
        total_items,
    })
}

pub(crate) async fn create_code_batch(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    input: &PromotionCodeBatchInput,
) -> Result<PromotionCodeBatchItem, CommerceServiceError> {
    if let Some(item) = retrieve_code_batch_by_key(pool, scope, &input.idempotency_key).await? {
        return Ok(item);
    }
    let batch_id = generated_id();
    let batch_uuid = Uuid::new_v4().to_string();
    let batch_no = reference("CBT");
    let actor_id = scope.actor_id()?;
    match pool {
        AdminPool::Postgres(pool) => {
            create_code_batch_postgres(
                pool,
                scope,
                input,
                batch_id,
                &batch_uuid,
                &batch_no,
                actor_id,
            )
            .await?
        }
        AdminPool::Sqlite(pool) => {
            create_code_batch_sqlite(
                pool,
                scope,
                input,
                batch_id,
                &batch_uuid,
                &batch_no,
                actor_id,
            )
            .await?
        }
    }
    retrieve_code_batch(pool, scope, batch_id)
        .await?
        .ok_or_else(|| CommerceServiceError::storage("created code batch was not found"))
}

async fn create_code_batch_postgres(
    pool: &PgPool,
    scope: &PromotionAdminScope,
    input: &PromotionCodeBatchInput,
    batch_id: i64,
    batch_uuid: &str,
    batch_no: &str,
    actor_id: i64,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin code generation", error))?;
    let stock=sqlx::query("SELECT offer_id,offer_version_id FROM promotion_coupon_stock WHERE id=$1 AND tenant_id=$2 AND organization_id=$3 AND status=1").bind(input.stock_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(&mut *tx).await.map_err(|error|storage("resolve code stock",error))?.ok_or_else(||CommerceServiceError::not_found("active coupon stock not found"))?;
    let offer_id: i64 = stock
        .try_get("offer_id")
        .map_err(|error| decode("offer_id", error))?;
    let version_id: i64 = stock
        .try_get("offer_version_id")
        .map_err(|error| decode("offer_version_id", error))?;
    sqlx::query("INSERT INTO promotion_code_batch (id,uuid,tenant_id,organization_id,stock_id,offer_id,offer_version_id,batch_no,code_type,requested_quantity,generated_quantity,code_length,code_prefix,starts_at,expires_at,status,idempotency_key,created_by,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,CAST($13 AS TIMESTAMPTZ),CAST($14 AS TIMESTAMPTZ),'GENERATING',$15,$16,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(batch_id).bind(batch_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(batch_no).bind(input.code_type.trim()).bind(input.quantity).bind(input.code_length).bind(input.code_prefix.trim()).bind(trimmed(&input.starts_at)).bind(trimmed(&input.expires_at)).bind(input.idempotency_key.trim()).bind(actor_id).execute(&mut *tx).await.map_err(|error|storage("create code batch",error))?;
    for _ in 0..input.quantity {
        let id = generated_id();
        let uuid = Uuid::new_v4().to_string();
        let code_no = reference("COD");
        let value = generated_code(&input.code_prefix, input.code_length)?;
        sqlx::query("INSERT INTO promotion_code (id,uuid,tenant_id,organization_id,code_batch_id,stock_id,offer_id,offer_version_id,code_no,promotion_code,code_type,max_claims,claimed_quantity,starts_at,expires_at,status,version,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,0,CAST($12 AS TIMESTAMPTZ),CAST($13 AS TIMESTAMPTZ),1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(batch_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(code_no).bind(value).bind(input.code_type.trim()).bind(trimmed(&input.starts_at)).bind(trimmed(&input.expires_at)).execute(&mut *tx).await.map_err(|error|storage("generate promotion code",error))?;
    }
    sqlx::query("UPDATE promotion_code_batch SET generated_quantity=requested_quantity,status='READY',updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND tenant_id=$2").bind(batch_id).bind(scope.tenant_id).execute(&mut *tx).await.map_err(|error|storage("complete code batch",error))?;
    tx.commit()
        .await
        .map_err(|error| storage("commit code generation", error))
}

async fn create_code_batch_sqlite(
    pool: &SqlitePool,
    scope: &PromotionAdminScope,
    input: &PromotionCodeBatchInput,
    batch_id: i64,
    batch_uuid: &str,
    batch_no: &str,
    actor_id: i64,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin code generation", error))?;
    let stock=sqlx::query("SELECT offer_id,offer_version_id FROM promotion_coupon_stock WHERE id=?1 AND tenant_id=?2 AND organization_id=?3 AND status=1").bind(input.stock_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(&mut *tx).await.map_err(|error|storage("resolve code stock",error))?.ok_or_else(||CommerceServiceError::not_found("active coupon stock not found"))?;
    let offer_id: i64 = stock
        .try_get("offer_id")
        .map_err(|error| decode("offer_id", error))?;
    let version_id: i64 = stock
        .try_get("offer_version_id")
        .map_err(|error| decode("offer_version_id", error))?;
    sqlx::query("INSERT INTO promotion_code_batch (id,uuid,tenant_id,organization_id,stock_id,offer_id,offer_version_id,batch_no,code_type,requested_quantity,generated_quantity,code_length,code_prefix,starts_at,expires_at,status,idempotency_key,created_by,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,0,?11,?12,?13,?14,'GENERATING',?15,?16,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(batch_id).bind(batch_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(batch_no).bind(input.code_type.trim()).bind(input.quantity).bind(input.code_length).bind(input.code_prefix.trim()).bind(trimmed(&input.starts_at)).bind(trimmed(&input.expires_at)).bind(input.idempotency_key.trim()).bind(actor_id).execute(&mut *tx).await.map_err(|error|storage("create code batch",error))?;
    for _ in 0..input.quantity {
        let id = generated_id();
        let uuid = Uuid::new_v4().to_string();
        let code_no = reference("COD");
        let value = generated_code(&input.code_prefix, input.code_length)?;
        sqlx::query("INSERT INTO promotion_code (id,uuid,tenant_id,organization_id,code_batch_id,stock_id,offer_id,offer_version_id,code_no,promotion_code,code_type,max_claims,claimed_quantity,starts_at,expires_at,status,version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,1,0,?12,?13,1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(id).bind(uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(batch_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(code_no).bind(value).bind(input.code_type.trim()).bind(trimmed(&input.starts_at)).bind(trimmed(&input.expires_at)).execute(&mut *tx).await.map_err(|error|storage("generate promotion code",error))?;
    }
    sqlx::query("UPDATE promotion_code_batch SET generated_quantity=requested_quantity,status='READY',updated_at=CURRENT_TIMESTAMP WHERE id=?1 AND tenant_id=?2").bind(batch_id).bind(scope.tenant_id).execute(&mut *tx).await.map_err(|error|storage("complete code batch",error))?;
    tx.commit()
        .await
        .map_err(|error| storage("commit code generation", error))
}

async fn retrieve_code_batch_by_key(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    key: &str,
) -> Result<Option<PromotionCodeBatchItem>, CommerceServiceError> {
    let id=match pool{
        AdminPool::Postgres(pool)=>sqlx::query_scalar::<_,i64>("SELECT id FROM promotion_code_batch WHERE tenant_id=$1 AND organization_id=$2 AND idempotency_key=$3").bind(scope.tenant_id).bind(scope.organization_id).bind(key.trim()).fetch_optional(pool).await.map_err(|error|storage("retrieve code batch idempotency",error))?,
        AdminPool::Sqlite(pool)=>sqlx::query_scalar::<_,i64>("SELECT id FROM promotion_code_batch WHERE tenant_id=?1 AND organization_id=?2 AND idempotency_key=?3").bind(scope.tenant_id).bind(scope.organization_id).bind(key.trim()).fetch_optional(pool).await.map_err(|error|storage("retrieve code batch idempotency",error))?,
    };
    match id {
        Some(id) => retrieve_code_batch(pool, scope, id).await,
        None => Ok(None),
    }
}

async fn retrieve_code_batch(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    id: i64,
) -> Result<Option<PromotionCodeBatchItem>, CommerceServiceError> {
    let columns="id,stock_id,offer_id,batch_no,code_type,requested_quantity,generated_quantity,code_length,code_prefix,CAST(starts_at AS TEXT) AS starts_at,CAST(expires_at AS TEXT) AS expires_at,status,CAST(created_at AS TEXT) AS created_at";
    let row = match pool {
        AdminPool::Postgres(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_code_batch WHERE id=$1 AND tenant_id=$2 AND organization_id=$3");
            sqlx::query(&sql)
                .bind(id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve code batch", error))?
                .map(ManagementRow::Postgres)
        }
        AdminPool::Sqlite(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_code_batch WHERE id=?1 AND tenant_id=?2 AND organization_id=?3");
            sqlx::query(&sql)
                .bind(id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve code batch", error))?
                .map(ManagementRow::Sqlite)
        }
    };
    row.map(map_code_batch).transpose()
}

pub(crate) async fn list_distribution_tasks(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionDistributionTaskItem>, CommerceServiceError> {
    let search = query.search_pattern();
    let columns="id,stock_id,offer_id,task_no,distribution_type,requested_quantity,succeeded_quantity,failed_quantity,status,CAST(created_at AS TEXT) AS created_at,CAST(completed_at AS TEXT) AS completed_at";
    let (total_items, rows) = match pool {
        AdminPool::Postgres(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_distribution_task WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(task_no) LIKE $3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list distribution tasks",error))?;
            let sql=format!("SELECT {columns} FROM promotion_distribution_task WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(task_no) LIKE $3) ORDER BY created_at DESC LIMIT $4 OFFSET $5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list distribution tasks", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Postgres)
                    .collect::<Vec<_>>(),
            )
        }
        AdminPool::Sqlite(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_distribution_task WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(task_no) LIKE ?3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list distribution tasks",error))?;
            let sql=format!("SELECT {columns} FROM promotion_distribution_task WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(task_no) LIKE ?3) ORDER BY created_at DESC LIMIT ?4 OFFSET ?5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list distribution tasks", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Sqlite)
                    .collect::<Vec<_>>(),
            )
        }
    };
    Ok(PromotionAdminPage {
        items: rows
            .into_iter()
            .map(map_distribution_task)
            .collect::<Result<_, _>>()?,
        total_items,
    })
}

pub(crate) async fn create_distribution_task(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    input: &PromotionDistributionInput,
) -> Result<PromotionDistributionTaskItem, CommerceServiceError> {
    if let Some(item) = retrieve_distribution_by_key(pool, scope, &input.idempotency_key).await? {
        return Ok(item);
    }
    let task_id = generated_id();
    let task_uuid = Uuid::new_v4().to_string();
    let task_no = reference("DST");
    let actor_id = scope.actor_id()?;
    match pool {
        AdminPool::Postgres(pool) => {
            create_distribution_postgres(
                pool, scope, input, task_id, &task_uuid, &task_no, actor_id,
            )
            .await?
        }
        AdminPool::Sqlite(pool) => {
            create_distribution_sqlite(pool, scope, input, task_id, &task_uuid, &task_no, actor_id)
                .await?
        }
    }
    retrieve_distribution_task(pool, scope, task_id)
        .await?
        .ok_or_else(|| CommerceServiceError::storage("created distribution task was not found"))
}

async fn create_distribution_postgres(
    pool: &PgPool,
    scope: &PromotionAdminScope,
    input: &PromotionDistributionInput,
    task_id: i64,
    task_uuid: &str,
    task_no: &str,
    actor_id: i64,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin coupon distribution", error))?;
    let stock=sqlx::query("SELECT offer_id,offer_version_id,stock_type,available_quantity,CAST(claim_ends_at AS TEXT) AS expires_at FROM promotion_coupon_stock WHERE id=$1 AND tenant_id=$2 AND organization_id=$3 AND status=1 FOR UPDATE").bind(input.stock_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(&mut *tx).await.map_err(|error|storage("resolve distribution stock",error))?.ok_or_else(||CommerceServiceError::not_found("active coupon stock not found"))?;
    let offer_id: i64 = stock
        .try_get("offer_id")
        .map_err(|error| decode("offer_id", error))?;
    let version_id: i64 = stock
        .try_get("offer_version_id")
        .map_err(|error| decode("offer_version_id", error))?;
    let stock_type: String = stock
        .try_get("stock_type")
        .map_err(|error| decode("stock_type", error))?;
    let available: i64 = stock
        .try_get("available_quantity")
        .map_err(|error| decode("available_quantity", error))?;
    let expires: Option<String> = stock
        .try_get("expires_at")
        .map_err(|error| decode("expires_at", error))?;
    let requested = input.owner_user_ids.len() as i64;
    if stock_type != "UNLIMITED" && available < requested {
        return Err(CommerceServiceError::validation(
            "coupon stock is insufficient",
        ));
    }
    sqlx::query("INSERT INTO promotion_distribution_task (id,uuid,tenant_id,organization_id,stock_id,offer_id,offer_version_id,task_no,distribution_type,requested_quantity,succeeded_quantity,failed_quantity,status,idempotency_key,created_by,started_at,completed_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DIRECT',$9,0,0,'RUNNING',$10,$11,CURRENT_TIMESTAMP,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(task_id).bind(task_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(task_no).bind(requested).bind(input.idempotency_key.trim()).bind(actor_id).execute(&mut *tx).await.map_err(|error|storage("create distribution task",error))?;
    for (index, user_id) in input.owner_user_ids.iter().enumerate() {
        insert_distributed_coupon_postgres(
            &mut tx,
            scope,
            input,
            task_id,
            offer_id,
            version_id,
            *user_id,
            expires.as_deref(),
            if stock_type == "UNLIMITED" {
                available
            } else {
                available - index as i64 - 1
            },
        )
        .await?;
    }
    let stock_update = if stock_type == "UNLIMITED" {
        "UPDATE promotion_coupon_stock SET claimed_quantity=claimed_quantity+$1,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND tenant_id=$3 AND organization_id=$4"
    } else {
        "UPDATE promotion_coupon_stock SET available_quantity=available_quantity-$1,claimed_quantity=claimed_quantity+$1,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND tenant_id=$3 AND organization_id=$4 AND available_quantity >= $1"
    };
    let affected = sqlx::query(stock_update)
        .bind(requested)
        .bind(input.stock_id)
        .bind(scope.tenant_id)
        .bind(scope.organization_id)
        .execute(&mut *tx)
        .await
        .map_err(|error| storage("consume coupon stock", error))?
        .rows_affected();
    if affected != 1 {
        return Err(CommerceServiceError::validation(
            "coupon stock changed during distribution",
        ));
    }
    sqlx::query("UPDATE promotion_distribution_task SET succeeded_quantity=requested_quantity,status='SUCCEEDED',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND tenant_id=$2").bind(task_id).bind(scope.tenant_id).execute(&mut *tx).await.map_err(|error|storage("complete distribution task",error))?;
    tx.commit()
        .await
        .map_err(|error| storage("commit coupon distribution", error))
}

async fn insert_distributed_coupon_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &PromotionAdminScope,
    input: &PromotionDistributionInput,
    task_id: i64,
    offer_id: i64,
    version_id: i64,
    user_id: i64,
    expires: Option<&str>,
    balance_after: i64,
) -> Result<(), CommerceServiceError> {
    let coupon_id = generated_id();
    let coupon_uuid = Uuid::new_v4().to_string();
    let coupon_no = reference("CPN");
    let coupon_code = generated_code("AC", 16)?;
    let request_no = reference("REQ");
    let item_key = format!("{}:{user_id}", input.idempotency_key.trim());
    sqlx::query("INSERT INTO promotion_user_coupon (id,uuid,tenant_id,organization_id,coupon_no,stock_id,code_id,offer_id,offer_version_id,subject_type,subject_id,owner_user_id,coupon_code,status,claimed_at,valid_from,expires_at,redeemed_at,disabled_at,source_type,source_id,request_no,idempotency_key,trace_id,version,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,$8,'USER',$9,$9,$10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CAST($11 AS TIMESTAMPTZ),NULL,NULL,'ADMIN_DISTRIBUTION',$12,$13,$14,'',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(coupon_id).bind(coupon_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(coupon_no).bind(input.stock_id).bind(offer_id).bind(version_id).bind(user_id).bind(coupon_code).bind(expires).bind(task_id).bind(&request_no).bind(&item_key).execute(&mut **tx).await.map_err(|error|storage("issue user coupon",error))?;
    sqlx::query("INSERT INTO promotion_distribution_record (id,uuid,tenant_id,organization_id,task_id,owner_user_id,user_coupon_id,status,failure_code,failure_detail,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'SUCCEEDED',NULL,NULL,CURRENT_TIMESTAMP)").bind(generated_id()).bind(Uuid::new_v4().to_string()).bind(scope.tenant_id).bind(scope.organization_id).bind(task_id).bind(user_id).bind(coupon_id).execute(&mut **tx).await.map_err(|error|storage("record coupon distribution",error))?;
    sqlx::query("INSERT INTO promotion_coupon_ledger_entry (id,uuid,tenant_id,stock_id,user_coupon_id,offer_id,subject_type,subject_id,direction,quantity_delta,balance_after,business_type,business_no,request_no,idempotency_key,source_type,source_id,trace_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,'USER',$7,'OUT',-1,$8,'ADMIN_DISTRIBUTION',$9,$10,$11,'ADMIN_DISTRIBUTION',$12,'',CURRENT_TIMESTAMP)").bind(generated_id()).bind(Uuid::new_v4().to_string()).bind(scope.tenant_id).bind(input.stock_id).bind(coupon_id).bind(offer_id).bind(user_id).bind(balance_after).bind(task_id.to_string()).bind(&request_no).bind(format!("ledger:{item_key}")).bind(task_id).execute(&mut **tx).await.map_err(|error|storage("record coupon ledger",error))?;
    Ok(())
}

async fn create_distribution_sqlite(
    pool: &SqlitePool,
    scope: &PromotionAdminScope,
    input: &PromotionDistributionInput,
    task_id: i64,
    task_uuid: &str,
    task_no: &str,
    actor_id: i64,
) -> Result<(), CommerceServiceError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| storage("begin coupon distribution", error))?;
    let stock=sqlx::query("SELECT offer_id,offer_version_id,stock_type,available_quantity,CAST(claim_ends_at AS TEXT) AS expires_at FROM promotion_coupon_stock WHERE id=?1 AND tenant_id=?2 AND organization_id=?3 AND status=1").bind(input.stock_id).bind(scope.tenant_id).bind(scope.organization_id).fetch_optional(&mut *tx).await.map_err(|error|storage("resolve distribution stock",error))?.ok_or_else(||CommerceServiceError::not_found("active coupon stock not found"))?;
    let offer_id: i64 = stock
        .try_get("offer_id")
        .map_err(|error| decode("offer_id", error))?;
    let version_id: i64 = stock
        .try_get("offer_version_id")
        .map_err(|error| decode("offer_version_id", error))?;
    let stock_type: String = stock
        .try_get("stock_type")
        .map_err(|error| decode("stock_type", error))?;
    let available: i64 = stock
        .try_get("available_quantity")
        .map_err(|error| decode("available_quantity", error))?;
    let expires: Option<String> = stock
        .try_get("expires_at")
        .map_err(|error| decode("expires_at", error))?;
    let requested = input.owner_user_ids.len() as i64;
    if stock_type != "UNLIMITED" && available < requested {
        return Err(CommerceServiceError::validation(
            "coupon stock is insufficient",
        ));
    }
    sqlx::query("INSERT INTO promotion_distribution_task (id,uuid,tenant_id,organization_id,stock_id,offer_id,offer_version_id,task_no,distribution_type,requested_quantity,succeeded_quantity,failed_quantity,status,idempotency_key,created_by,started_at,completed_at,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'DIRECT',?9,0,0,'RUNNING',?10,?11,CURRENT_TIMESTAMP,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(task_id).bind(task_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(input.stock_id).bind(offer_id).bind(version_id).bind(task_no).bind(requested).bind(input.idempotency_key.trim()).bind(actor_id).execute(&mut *tx).await.map_err(|error|storage("create distribution task",error))?;
    for (index, user_id) in input.owner_user_ids.iter().enumerate() {
        insert_distributed_coupon_sqlite(
            &mut tx,
            scope,
            input,
            task_id,
            offer_id,
            version_id,
            *user_id,
            expires.as_deref(),
            if stock_type == "UNLIMITED" {
                available
            } else {
                available - index as i64 - 1
            },
        )
        .await?;
    }
    let stock_update = if stock_type == "UNLIMITED" {
        "UPDATE promotion_coupon_stock SET claimed_quantity=claimed_quantity+?1,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?2 AND tenant_id=?3 AND organization_id=?4"
    } else {
        "UPDATE promotion_coupon_stock SET available_quantity=available_quantity-?1,claimed_quantity=claimed_quantity+?1,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?2 AND tenant_id=?3 AND organization_id=?4 AND available_quantity >= ?1"
    };
    let affected = sqlx::query(stock_update)
        .bind(requested)
        .bind(input.stock_id)
        .bind(scope.tenant_id)
        .bind(scope.organization_id)
        .execute(&mut *tx)
        .await
        .map_err(|error| storage("consume coupon stock", error))?
        .rows_affected();
    if affected != 1 {
        return Err(CommerceServiceError::validation(
            "coupon stock changed during distribution",
        ));
    }
    sqlx::query("UPDATE promotion_distribution_task SET succeeded_quantity=requested_quantity,status='SUCCEEDED',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?1 AND tenant_id=?2").bind(task_id).bind(scope.tenant_id).execute(&mut *tx).await.map_err(|error|storage("complete distribution task",error))?;
    tx.commit()
        .await
        .map_err(|error| storage("commit coupon distribution", error))
}

async fn insert_distributed_coupon_sqlite(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    scope: &PromotionAdminScope,
    input: &PromotionDistributionInput,
    task_id: i64,
    offer_id: i64,
    version_id: i64,
    user_id: i64,
    expires: Option<&str>,
    balance_after: i64,
) -> Result<(), CommerceServiceError> {
    let coupon_id = generated_id();
    let coupon_uuid = Uuid::new_v4().to_string();
    let coupon_no = reference("CPN");
    let coupon_code = generated_code("AC", 16)?;
    let request_no = reference("REQ");
    let item_key = format!("{}:{user_id}", input.idempotency_key.trim());
    sqlx::query("INSERT INTO promotion_user_coupon (id,uuid,tenant_id,organization_id,coupon_no,stock_id,code_id,offer_id,offer_version_id,subject_type,subject_id,owner_user_id,coupon_code,status,claimed_at,valid_from,expires_at,redeemed_at,disabled_at,source_type,source_id,request_no,idempotency_key,trace_id,version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,NULL,?7,?8,'USER',?9,?9,?10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?11,NULL,NULL,'ADMIN_DISTRIBUTION',?12,?13,?14,'',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(coupon_id).bind(coupon_uuid).bind(scope.tenant_id).bind(scope.organization_id).bind(coupon_no).bind(input.stock_id).bind(offer_id).bind(version_id).bind(user_id).bind(coupon_code).bind(expires).bind(task_id).bind(&request_no).bind(&item_key).execute(&mut **tx).await.map_err(|error|storage("issue user coupon",error))?;
    sqlx::query("INSERT INTO promotion_distribution_record (id,uuid,tenant_id,organization_id,task_id,owner_user_id,user_coupon_id,status,failure_code,failure_detail,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,'SUCCEEDED',NULL,NULL,CURRENT_TIMESTAMP)").bind(generated_id()).bind(Uuid::new_v4().to_string()).bind(scope.tenant_id).bind(scope.organization_id).bind(task_id).bind(user_id).bind(coupon_id).execute(&mut **tx).await.map_err(|error|storage("record coupon distribution",error))?;
    sqlx::query("INSERT INTO promotion_coupon_ledger_entry (id,uuid,tenant_id,stock_id,user_coupon_id,offer_id,subject_type,subject_id,direction,quantity_delta,balance_after,business_type,business_no,request_no,idempotency_key,source_type,source_id,trace_id,created_at) VALUES (?1,?2,?3,?4,?5,?6,'USER',?7,'OUT',-1,?8,'ADMIN_DISTRIBUTION',?9,?10,?11,'ADMIN_DISTRIBUTION',?12,'',CURRENT_TIMESTAMP)").bind(generated_id()).bind(Uuid::new_v4().to_string()).bind(scope.tenant_id).bind(input.stock_id).bind(coupon_id).bind(offer_id).bind(user_id).bind(balance_after).bind(task_id.to_string()).bind(&request_no).bind(format!("ledger:{item_key}")).bind(task_id).execute(&mut **tx).await.map_err(|error|storage("record coupon ledger",error))?;
    Ok(())
}

async fn retrieve_distribution_by_key(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    key: &str,
) -> Result<Option<PromotionDistributionTaskItem>, CommerceServiceError> {
    let id=match pool{AdminPool::Postgres(pool)=>sqlx::query_scalar::<_,i64>("SELECT id FROM promotion_distribution_task WHERE tenant_id=$1 AND organization_id=$2 AND idempotency_key=$3").bind(scope.tenant_id).bind(scope.organization_id).bind(key.trim()).fetch_optional(pool).await.map_err(|error|storage("retrieve distribution idempotency",error))?,AdminPool::Sqlite(pool)=>sqlx::query_scalar::<_,i64>("SELECT id FROM promotion_distribution_task WHERE tenant_id=?1 AND organization_id=?2 AND idempotency_key=?3").bind(scope.tenant_id).bind(scope.organization_id).bind(key.trim()).fetch_optional(pool).await.map_err(|error|storage("retrieve distribution idempotency",error))?};
    match id {
        Some(id) => retrieve_distribution_task(pool, scope, id).await,
        None => Ok(None),
    }
}

async fn retrieve_distribution_task(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    id: i64,
) -> Result<Option<PromotionDistributionTaskItem>, CommerceServiceError> {
    let columns="id,stock_id,offer_id,task_no,distribution_type,requested_quantity,succeeded_quantity,failed_quantity,status,CAST(created_at AS TEXT) AS created_at,CAST(completed_at AS TEXT) AS completed_at";
    let row = match pool {
        AdminPool::Postgres(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_distribution_task WHERE id=$1 AND tenant_id=$2 AND organization_id=$3");
            sqlx::query(&sql)
                .bind(id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve distribution task", error))?
                .map(ManagementRow::Postgres)
        }
        AdminPool::Sqlite(pool) => {
            let sql=format!("SELECT {columns} FROM promotion_distribution_task WHERE id=?1 AND tenant_id=?2 AND organization_id=?3");
            sqlx::query(&sql)
                .bind(id)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .fetch_optional(pool)
                .await
                .map_err(|error| storage("retrieve distribution task", error))?
                .map(ManagementRow::Sqlite)
        }
    };
    row.map(map_distribution_task).transpose()
}

pub(crate) async fn list_user_coupons(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionAdminUserCouponItem>, CommerceServiceError> {
    let search = query.search_pattern();
    let columns="id,coupon_no,stock_id,offer_id,owner_user_id,coupon_code,status,CAST(claimed_at AS TEXT) AS claimed_at,CAST(valid_from AS TEXT) AS valid_from,CAST(expires_at AS TEXT) AS expires_at,CAST(redeemed_at AS TEXT) AS redeemed_at,source_type,source_id";
    let (total_items, rows) = match pool {
        AdminPool::Postgres(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_user_coupon WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(coupon_no) LIKE $3 OR CAST(owner_user_id AS TEXT) LIKE $3) AND ($4 IS NULL OR status=$4)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).bind(query.status).fetch_one(pool).await.map_err(|error|storage("list user coupons",error))?;
            let sql=format!("SELECT {columns} FROM promotion_user_coupon WHERE tenant_id=$1 AND organization_id=$2 AND ($3='%%' OR LOWER(coupon_no) LIKE $3 OR CAST(owner_user_id AS TEXT) LIKE $3) AND ($4 IS NULL OR status=$4) ORDER BY claimed_at DESC LIMIT $5 OFFSET $6");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list user coupons", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Postgres)
                    .collect::<Vec<_>>(),
            )
        }
        AdminPool::Sqlite(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_user_coupon WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(coupon_no) LIKE ?3 OR CAST(owner_user_id AS TEXT) LIKE ?3) AND (?4 IS NULL OR status=?4)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).bind(query.status).fetch_one(pool).await.map_err(|error|storage("list user coupons",error))?;
            let sql=format!("SELECT {columns} FROM promotion_user_coupon WHERE tenant_id=?1 AND organization_id=?2 AND (?3='%%' OR LOWER(coupon_no) LIKE ?3 OR CAST(owner_user_id AS TEXT) LIKE ?3) AND (?4 IS NULL OR status=?4) ORDER BY claimed_at DESC LIMIT ?5 OFFSET ?6");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.status)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list user coupons", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Sqlite)
                    .collect::<Vec<_>>(),
            )
        }
    };
    Ok(PromotionAdminPage {
        items: rows
            .into_iter()
            .map(map_user_coupon)
            .collect::<Result<_, _>>()?,
        total_items,
    })
}

pub(crate) async fn list_coupon_ledger(
    pool: &AdminPool,
    scope: &PromotionAdminScope,
    query: &PromotionAdminListQuery,
) -> Result<PromotionAdminPage<PromotionCouponLedgerItem>, CommerceServiceError> {
    let search = query.search_pattern();
    let columns="l.id,l.stock_id,l.user_coupon_id,l.offer_id,l.subject_id,l.direction,l.quantity_delta,l.balance_after,l.business_type,l.business_no,CAST(l.created_at AS TEXT) AS created_at";
    let (total_items, rows) = match pool {
        AdminPool::Postgres(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_coupon_ledger_entry l JOIN promotion_coupon_stock s ON s.tenant_id=l.tenant_id AND s.id=l.stock_id WHERE l.tenant_id=$1 AND s.organization_id=$2 AND ($3='%%' OR LOWER(l.business_no) LIKE $3 OR LOWER(l.business_type) LIKE $3 OR CAST(l.subject_id AS TEXT) LIKE $3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list coupon ledger",error))?;
            let sql=format!("SELECT {columns} FROM promotion_coupon_ledger_entry l JOIN promotion_coupon_stock s ON s.tenant_id=l.tenant_id AND s.id=l.stock_id WHERE l.tenant_id=$1 AND s.organization_id=$2 AND ($3='%%' OR LOWER(l.business_no) LIKE $3 OR LOWER(l.business_type) LIKE $3 OR CAST(l.subject_id AS TEXT) LIKE $3) ORDER BY l.created_at DESC LIMIT $4 OFFSET $5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list coupon ledger", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Postgres)
                    .collect::<Vec<_>>(),
            )
        }
        AdminPool::Sqlite(pool) => {
            let total=sqlx::query_scalar::<_,i64>("SELECT COUNT(*) FROM promotion_coupon_ledger_entry l JOIN promotion_coupon_stock s ON s.tenant_id=l.tenant_id AND s.id=l.stock_id WHERE l.tenant_id=?1 AND s.organization_id=?2 AND (?3='%%' OR LOWER(l.business_no) LIKE ?3 OR LOWER(l.business_type) LIKE ?3 OR CAST(l.subject_id AS TEXT) LIKE ?3)").bind(scope.tenant_id).bind(scope.organization_id).bind(&search).fetch_one(pool).await.map_err(|error|storage("list coupon ledger",error))?;
            let sql=format!("SELECT {columns} FROM promotion_coupon_ledger_entry l JOIN promotion_coupon_stock s ON s.tenant_id=l.tenant_id AND s.id=l.stock_id WHERE l.tenant_id=?1 AND s.organization_id=?2 AND (?3='%%' OR LOWER(l.business_no) LIKE ?3 OR LOWER(l.business_type) LIKE ?3 OR CAST(l.subject_id AS TEXT) LIKE ?3) ORDER BY l.created_at DESC LIMIT ?4 OFFSET ?5");
            let rows = sqlx::query(&sql)
                .bind(scope.tenant_id)
                .bind(scope.organization_id)
                .bind(&search)
                .bind(query.page_size)
                .bind(query.offset())
                .fetch_all(pool)
                .await
                .map_err(|error| storage("list coupon ledger", error))?;
            (
                total,
                rows.into_iter()
                    .map(ManagementRow::Sqlite)
                    .collect::<Vec<_>>(),
            )
        }
    };
    Ok(PromotionAdminPage {
        items: rows.into_iter().map(map_ledger).collect::<Result<_, _>>()?,
        total_items,
    })
}

enum ManagementRow {
    Postgres(sqlx::postgres::PgRow),
    Sqlite(sqlx::sqlite::SqliteRow),
}

impl ManagementRow {
    fn i32(&self, name: &str) -> Result<i32, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode(name, error))
    }
    fn i64(&self, name: &str) -> Result<i64, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode(name, error))
    }
    fn string(&self, name: &str) -> Result<String, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode(name, error))
    }
    fn optional_string(&self, name: &str) -> Result<Option<String>, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode(name, error))
    }
    fn optional_i64(&self, name: &str) -> Result<Option<i64>, CommerceServiceError> {
        match self {
            Self::Postgres(row) => row.try_get(name),
            Self::Sqlite(row) => row.try_get(name),
        }
        .map_err(|error| decode(name, error))
    }
}

fn map_campaign(row: ManagementRow) -> Result<PromotionCampaignItem, CommerceServiceError> {
    Ok(PromotionCampaignItem {
        id: row.i64("id")?.to_string(),
        campaign_no: row.string("campaign_no")?,
        campaign_code: row.optional_string("campaign_code")?,
        display_name: row.string("display_name")?,
        description: row.optional_string("description")?,
        channel_scope: row.string("channel_scope")?,
        audience_scope: row.string("audience_scope")?,
        starts_at: row.string("starts_at")?,
        ends_at: row.optional_string("ends_at")?,
        status: row.string("status")?,
        version: row.i64("version")?,
        updated_at: row.string("updated_at")?,
    })
}

fn map_offer(row: ManagementRow) -> Result<PromotionOfferItem, CommerceServiceError> {
    Ok(PromotionOfferItem {
        id: row.i64("id")?.to_string(),
        campaign_id: row
            .optional_i64("campaign_id")?
            .map(|value| value.to_string()),
        offer_no: row.string("offer_no")?,
        offer_code: row.optional_string("offer_code")?,
        offer_type: row.string("offer_type")?,
        display_name: row.string("display_name")?,
        description: row.optional_string("description")?,
        priority: row.i32("priority")?,
        starts_at: row.string("starts_at")?,
        ends_at: row.optional_string("ends_at")?,
        status: row.i32("status")?,
        discount_type: row.optional_string("discount_type")?,
        discount_value: row.optional_string("discount_value")?,
        minimum_amount: row.optional_string("minimum_amount")?,
        maximum_discount_amount: row.optional_string("maximum_discount_amount")?,
        currency_code: row.optional_string("currency_code")?,
        version: row.i64("version")?,
        updated_at: row.string("updated_at")?,
    })
}

fn map_stock(row: ManagementRow) -> Result<PromotionCouponStockItem, CommerceServiceError> {
    Ok(PromotionCouponStockItem {
        id: row.i64("id")?.to_string(),
        offer_id: row.i64("offer_id")?.to_string(),
        stock_no: row.string("stock_no")?,
        stock_type: row.string("stock_type")?,
        total_quantity: row.i64("total_quantity")?,
        available_quantity: row.i64("available_quantity")?,
        claimed_quantity: row.i64("claimed_quantity")?,
        redeemed_quantity: row.i64("redeemed_quantity")?,
        locked_quantity: row.i64("locked_quantity")?,
        per_user_limit: row.i32("per_user_limit")?,
        claim_starts_at: row.optional_string("claim_starts_at")?,
        claim_ends_at: row.optional_string("claim_ends_at")?,
        status: row.i32("status")?,
    })
}

fn map_code_batch(row: ManagementRow) -> Result<PromotionCodeBatchItem, CommerceServiceError> {
    Ok(PromotionCodeBatchItem {
        id: row.i64("id")?.to_string(),
        stock_id: row.i64("stock_id")?.to_string(),
        offer_id: row.i64("offer_id")?.to_string(),
        batch_no: row.string("batch_no")?,
        code_type: row.string("code_type")?,
        requested_quantity: row.i64("requested_quantity")?,
        generated_quantity: row.i64("generated_quantity")?,
        code_length: row.i32("code_length")?,
        code_prefix: row.string("code_prefix")?,
        starts_at: row.optional_string("starts_at")?,
        expires_at: row.optional_string("expires_at")?,
        status: row.string("status")?,
        created_at: row.string("created_at")?,
    })
}

fn map_distribution_task(
    row: ManagementRow,
) -> Result<PromotionDistributionTaskItem, CommerceServiceError> {
    Ok(PromotionDistributionTaskItem {
        id: row.i64("id")?.to_string(),
        stock_id: row.i64("stock_id")?.to_string(),
        offer_id: row.i64("offer_id")?.to_string(),
        task_no: row.string("task_no")?,
        distribution_type: row.string("distribution_type")?,
        requested_quantity: row.i64("requested_quantity")?,
        succeeded_quantity: row.i64("succeeded_quantity")?,
        failed_quantity: row.i64("failed_quantity")?,
        status: row.string("status")?,
        created_at: row.string("created_at")?,
        completed_at: row.optional_string("completed_at")?,
    })
}

fn map_user_coupon(
    row: ManagementRow,
) -> Result<PromotionAdminUserCouponItem, CommerceServiceError> {
    Ok(PromotionAdminUserCouponItem {
        id: row.i64("id")?.to_string(),
        coupon_no: row.string("coupon_no")?,
        stock_id: row.i64("stock_id")?.to_string(),
        offer_id: row.i64("offer_id")?.to_string(),
        owner_user_id: row.i64("owner_user_id")?.to_string(),
        coupon_code: mask_code(&row.string("coupon_code")?),
        status: row.i32("status")?,
        claimed_at: row.string("claimed_at")?,
        valid_from: row.string("valid_from")?,
        expires_at: row.optional_string("expires_at")?,
        redeemed_at: row.optional_string("redeemed_at")?,
        source_type: row.optional_string("source_type")?,
        source_id: row
            .optional_i64("source_id")?
            .map(|value| value.to_string()),
    })
}

fn map_ledger(row: ManagementRow) -> Result<PromotionCouponLedgerItem, CommerceServiceError> {
    Ok(PromotionCouponLedgerItem {
        id: row.i64("id")?.to_string(),
        stock_id: row.i64("stock_id")?.to_string(),
        user_coupon_id: row
            .optional_i64("user_coupon_id")?
            .map(|value| value.to_string()),
        offer_id: row.i64("offer_id")?.to_string(),
        subject_id: row
            .optional_i64("subject_id")?
            .map(|value| value.to_string()),
        direction: row.string("direction")?,
        quantity_delta: row.i64("quantity_delta")?,
        balance_after: row.i64("balance_after")?,
        business_type: row.string("business_type")?,
        business_no: row.string("business_no")?,
        created_at: row.string("created_at")?,
    })
}

fn generated_id() -> i64 {
    let value = (Uuid::new_v4().as_u128() & 0x7fff_ffff_ffff_ffff) as i64;
    if value == 0 {
        1
    } else {
        value
    }
}
fn reference(prefix: &str) -> String {
    let suffix = Uuid::new_v4().simple().to_string();
    format!(
        "{prefix}-{}-{}",
        Utc::now().format("%Y%m%d%H%M%S"),
        &suffix[..8]
    )
    .to_ascii_uppercase()
}
fn generated_code(prefix: &str, length: i32) -> Result<String, CommerceServiceError> {
    let prefix = prefix.trim().to_ascii_uppercase();
    if !prefix.chars().all(|value| value.is_ascii_alphanumeric()) || prefix.len() >= length as usize
    {
        return Err(CommerceServiceError::validation(
            "code_prefix must be alphanumeric and shorter than code_length",
        ));
    }
    let mut random = String::new();
    while random.len() < length as usize - prefix.len() {
        random.push_str(&Uuid::new_v4().simple().to_string().to_ascii_uppercase());
    }
    random.truncate(length as usize - prefix.len());
    Ok(format!("{prefix}{random}"))
}
fn mask_code(value: &str) -> String {
    if value.chars().count() <= 8 {
        return "****".to_owned();
    }
    let prefix = value.chars().take(4).collect::<String>();
    let suffix = value
        .chars()
        .rev()
        .take(4)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    format!("{prefix}****{suffix}")
}
fn trimmed(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}
fn storage(context: &str, error: sqlx::Error) -> CommerceServiceError {
    CommerceServiceError::storage(format!("{context}: {error}"))
}
fn decode(column: &str, error: sqlx::Error) -> CommerceServiceError {
    CommerceServiceError::storage(format!("decode promotion admin column {column}: {error}"))
}
