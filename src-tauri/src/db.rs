use rusqlite::{Connection, Result};
use std::path::Path;

/// Initialize the SQLite database schema
pub fn init_database(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for high concurrency
    conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")?;

    // Create tables
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS dictionary_cache (
            id TEXT PRIMARY KEY,
            normalized_word TEXT NOT NULL UNIQUE,
            raw_entry TEXT NOT NULL,
            source TEXT DEFAULT 'nvidia_nim',
            model_name TEXT,
            created_at INTEGER NOT NULL,
            last_accessed_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_words (
            id TEXT PRIMARY KEY,
            word TEXT NOT NULL,
            normalized_word TEXT NOT NULL UNIQUE,
            dictionary_entry TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            source TEXT DEFAULT 'manual',
            mastery INTEGER DEFAULT 0,
            favorite INTEGER DEFAULT 0,
            is_known INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS fsrs_cards (
            id TEXT PRIMARY KEY,
            word_id TEXT NOT NULL UNIQUE,
            state INTEGER DEFAULT 0,
            due INTEGER NOT NULL,
            stability REAL DEFAULT 0.0,
            difficulty REAL DEFAULT 0.0,
            elapsed_days INTEGER DEFAULT 0,
            scheduled_days INTEGER DEFAULT 0,
            reps INTEGER DEFAULT 0,
            lapses INTEGER DEFAULT 0,
            last_review INTEGER,
            FOREIGN KEY (word_id) REFERENCES saved_words(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS review_logs (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL,
            word_id TEXT NOT NULL,
            rating TEXT NOT NULL,
            state INTEGER NOT NULL,
            due INTEGER NOT NULL,
            stability REAL NOT NULL,
            difficulty REAL NOT NULL,
            elapsed_days INTEGER NOT NULL,
            last_elapsed_days INTEGER NOT NULL,
            scheduled_days INTEGER NOT NULL,
            review INTEGER NOT NULL,
            FOREIGN KEY (card_id) REFERENCES fsrs_cards(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS weakness_profiles (
            word_id TEXT PRIMARY KEY,
            meaning_errors INTEGER DEFAULT 0,
            spelling_errors INTEGER DEFAULT 0,
            listening_errors INTEGER DEFAULT 0,
            context_errors INTEGER DEFAULT 0,
            production_errors INTEGER DEFAULT 0,
            last_error_type TEXT,
            FOREIGN KEY (word_id) REFERENCES saved_words(id) ON DELETE CASCADE
        );
        "#
    )?;

    Ok(conn)
}
