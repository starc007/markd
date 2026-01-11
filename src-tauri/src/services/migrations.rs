use rusqlite::{Connection, Result};

/// Migration represents a single database migration
struct Migration {
    version: i32,
    description: &'static str,
    up: fn(&Connection) -> Result<()>,
}

/// Get all migrations in order
fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "Initial complete schema",
        up: migration_v1_complete_schema,
    }]
}

/// Run all pending migrations
pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create migrations table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Get current version
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    println!("[Migrations] Current database version: {}", current_version);

    // Run pending migrations
    let migrations = get_migrations();
    for migration in migrations.iter().filter(|m| m.version > current_version) {
        println!(
            "[Migrations] Running migration v{}: {}",
            migration.version, migration.description
        );

        // Run migration in a transaction
        let tx = conn.unchecked_transaction()?;
        (migration.up)(&tx)?;

        // Record migration
        tx.execute(
            "INSERT INTO schema_migrations (version, description, applied_at) VALUES (?1, ?2, ?3)",
            [
                &migration.version as &dyn rusqlite::ToSql,
                &migration.description,
                &chrono::Utc::now().timestamp_millis(),
            ],
        )?;

        tx.commit()?;
        println!("[Migrations] ✓ Migration v{} completed", migration.version);
    }

    let final_version: i32 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?;

    println!(
        "[Migrations] Database up to date (version {})",
        final_version
    );

    Ok(())
}

/// Migration v1: Complete schema with all features
fn migration_v1_complete_schema(conn: &Connection) -> Result<()> {
    // ============================================
    // FOLDERS
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)",
        [],
    )?;

    // ============================================
    // NOTES (with page hierarchy support)
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            preview TEXT,
            file_path TEXT,
            folder_id TEXT,
            parent_id TEXT,
            pinned INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
            FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)",
        [],
    )?;

    // Notes FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            id UNINDEXED,
            title,
            content,
            tags,
            tokenize='porter unicode61'
        )",
        [],
    )?;

    // ============================================
    // PAGE LINKS (for page references/backlinks)
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS page_links (
            id TEXT PRIMARY KEY,
            source_page_id TEXT NOT NULL,
            target_page_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (source_page_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (target_page_id) REFERENCES notes(id) ON DELETE CASCADE,
            UNIQUE(source_page_id, target_page_id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_page_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_page_id)",
        [],
    )?;

    // ============================================
    // STICKY NOTES
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sticky_notes (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            color_id TEXT NOT NULL DEFAULT 'default',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Sticky Notes FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS sticky_notes_fts USING fts5(
            id UNINDEXED,
            content,
            tokenize='porter unicode61'
        )",
        [],
    )?;

    // ============================================
    // BOOKMARKS (with favicon support)
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            tags TEXT,
            folder_id TEXT,
            favicon TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_id)",
        [],
    )?;

    // Bookmarks FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
            id UNINDEXED,
            url,
            title,
            tags,
            tokenize='porter unicode61'
        )",
        [],
    )?;

    // ============================================
    // TAGS
    // ============================================
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS note_tags (
            note_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(())
}

// Future migrations will be added here as needed
// Example for next migration:
//
// /// Migration v2: Add new feature
// fn migration_v2_new_feature(conn: &Connection) -> Result<()> {
//     conn.execute(
//         "ALTER TABLE some_table ADD COLUMN new_column TEXT",
//         [],
//     )?;
//     Ok(())
// }
