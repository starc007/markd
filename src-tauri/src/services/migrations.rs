use rusqlite::{Connection, Result};

/// Database schema version
const CURRENT_VERSION: i32 = 3;

/// Migration represents a single database migration
struct Migration {
    version: i32,
    description: &'static str,
    up: fn(&Connection) -> Result<()>,
}

/// Get all migrations in order
fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Initial schema",
            up: migration_v1_initial_schema,
        },
        Migration {
            version: 2,
            description: "Add page hierarchy and linking",
            up: migration_v2_page_hierarchy,
        },
        Migration {
            version: 3,
            description: "Add sticky notes FTS for search",
            up: migration_v3_sticky_notes_fts,
        },
    ]
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

/// Migration v1: Initial schema
fn migration_v1_initial_schema(conn: &Connection) -> Result<()> {
    // Create folders table
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

    // Create notes table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            preview TEXT,
            file_path TEXT,
            folder_id TEXT,
            pinned INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        )",
        [],
    )?;

    // Create sticky_notes table
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

    // Create tags table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )",
        [],
    )?;

    // Create note_tags junction table
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

    // Create FTS5 virtual table
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

    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id)",
        [],
    )?;

    Ok(())
}

/// Migration v2: Add page hierarchy and linking
fn migration_v2_page_hierarchy(conn: &Connection) -> Result<()> {
    // Add parent_id column to notes table if it doesn't exist
    let has_parent_id: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('notes') WHERE name='parent_id'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .unwrap_or(false);

    if !has_parent_id {
        conn.execute(
            "ALTER TABLE notes ADD COLUMN parent_id TEXT REFERENCES notes(id) ON DELETE SET NULL",
            [],
        )?;

        // Create index for parent_id
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)",
            [],
        )?;
    }

    // Create page_links table for tracking page references
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

    // Create indexes for page_links
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_page_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_page_id)",
        [],
    )?;

    Ok(())
}

/// Migration v3: Add sticky notes FTS for search
fn migration_v3_sticky_notes_fts(conn: &Connection) -> Result<()> {
    // Create FTS5 virtual table for sticky notes
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS sticky_notes_fts USING fts5(
            id UNINDEXED,
            content,
            tokenize='porter unicode61'
        )",
        [],
    )?;

    // Populate the FTS table with existing sticky notes
    conn.execute(
        "INSERT INTO sticky_notes_fts (id, content)
         SELECT id, content FROM sticky_notes",
        [],
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_migrations() {
        let conn = Connection::open_in_memory().unwrap();

        // Run migrations
        run_migrations(&conn).unwrap();

        // Verify version
        let version: i32 = conn
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(version, CURRENT_VERSION);

        // Verify tables exist
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>>>()
            .unwrap();

        assert!(tables.contains(&"notes".to_string()));
        assert!(tables.contains(&"folders".to_string()));
        assert!(tables.contains(&"page_links".to_string()));
        assert!(tables.contains(&"schema_migrations".to_string()));

        // Verify notes table has parent_id column
        let has_parent_id: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('notes') WHERE name='parent_id'",
                [],
                |row| {
                    let count: i32 = row.get(0)?;
                    Ok(count > 0)
                },
            )
            .unwrap();

        assert!(has_parent_id);
    }

    #[test]
    fn test_idempotent_migrations() {
        let conn = Connection::open_in_memory().unwrap();

        // Run migrations twice
        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();

        // Should still be at current version
        let version: i32 = conn
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(version, CURRENT_VERSION);

        // Should only have CURRENT_VERSION records
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(count, CURRENT_VERSION);
    }
}
