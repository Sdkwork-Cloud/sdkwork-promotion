use sdkwork_commerce_promotion_repository_sqlx::{
    PostgresPromotionAdminRepository, SqlitePromotionAdminRepository,
};
use sdkwork_commerce_promotion_service::{PromotionAdminRepositoryPort, PromotionAdminService};
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_promotion_database_host::{
    bootstrap_promotion_database_from_env, PromotionDatabaseHost,
};
use std::sync::Arc;

pub struct PromotionServiceHost {
    database: PromotionDatabaseHost,
    promotion_admin: Arc<PromotionAdminService>,
}

impl PromotionServiceHost {
    pub async fn new() -> Self {
        Self::from_env()
            .await
            .expect("promotion service host bootstrap failed")
    }

    pub async fn from_env() -> Result<Self, String> {
        let database = bootstrap_promotion_database_from_env().await?;
        let repository: Arc<dyn PromotionAdminRepositoryPort> = match database.pool() {
            DatabasePool::Postgres(pool, _) => {
                Arc::new(PostgresPromotionAdminRepository::new(pool.clone()))
            }
            DatabasePool::Sqlite(pool, _) => {
                Arc::new(SqlitePromotionAdminRepository::new(pool.clone()))
            }
        };
        Ok(Self {
            database,
            promotion_admin: Arc::new(PromotionAdminService::new(repository)),
        })
    }

    pub fn database_pool(&self) -> &DatabasePool {
        self.database.pool()
    }

    pub fn database_module(&self) -> std::sync::Arc<sdkwork_database_spi::DefaultDatabaseModule> {
        self.database.module()
    }

    pub fn promotion_admin_service(&self) -> Arc<PromotionAdminService> {
        self.promotion_admin.clone()
    }
}
