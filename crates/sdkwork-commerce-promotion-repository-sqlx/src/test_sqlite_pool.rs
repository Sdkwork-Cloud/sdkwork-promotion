use sqlx::SqlitePool;

pub fn promotion_repository_test_migration_sql() -> &'static str {
    include_str!("../test_migrations/0001_promotion_repository_test.sql")
}

pub async fn promotion_migrated_sqlite_memory_pool() -> SqlitePool {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .expect("promotion repository sqlite memory pool");
    sqlx::query(promotion_repository_test_migration_sql())
        .execute(&pool)
        .await
        .expect("promotion repository test migration");
    pool
}
