export const CURRENT_DB_VERSION = 1;

export const SQLITE_MIGRATIONS = [
  {
    version: 1,
    name: "initial_lexiglass_schema",
    sql: `
      -- 1. Words table
      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        normalized_word TEXT NOT NULL UNIQUE,
        ipa_us TEXT,
        ipa_uk TEXT,
        cefr TEXT,
        frequency TEXT,
        parts_of_speech_summary TEXT,
        primary_meaning_vi TEXT,
        raw_dictionary_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_reviewed_at TEXT,
        source_context TEXT,
        notes TEXT DEFAULT '',
        mastery INTEGER DEFAULT 0,
        favorite INTEGER DEFAULT 0,
        is_known INTEGER DEFAULT 0
      );

      -- 2. Meanings table (normalized)
      CREATE TABLE IF NOT EXISTS meanings (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        part_of_speech TEXT NOT NULL,
        vietnamese TEXT NOT NULL,
        english_definition TEXT NOT NULL,
        register TEXT,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      );

      -- 3. Examples table
      CREATE TABLE IF NOT EXISTS examples (
        id TEXT PRIMARY KEY,
        meaning_id TEXT NOT NULL,
        english TEXT NOT NULL,
        vietnamese TEXT NOT NULL,
        FOREIGN KEY (meaning_id) REFERENCES meanings(id) ON DELETE CASCADE
      );

      -- 4. Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      -- 5. Word tags junction
      CREATE TABLE IF NOT EXISTS word_tags (
        word_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (word_id, tag_id),
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- 6. Review cards (FSRS state)
      CREATE TABLE IF NOT EXISTS review_cards (
        word_id TEXT PRIMARY KEY,
        due TEXT NOT NULL,
        stability REAL NOT NULL,
        difficulty REAL NOT NULL,
        elapsed_days INTEGER NOT NULL,
        scheduled_days INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        state INTEGER NOT NULL,
        last_review TEXT,
        meaning_errors INTEGER DEFAULT 0,
        spelling_errors INTEGER DEFAULT 0,
        listening_errors INTEGER DEFAULT 0,
        context_errors INTEGER DEFAULT 0,
        production_errors INTEGER DEFAULT 0,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      );

      -- 7. Review logs
      CREATE TABLE IF NOT EXISTS review_logs (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        card_type TEXT NOT NULL,
        rating TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        interval_days REAL NOT NULL,
        response_time_ms INTEGER,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      );

      -- 8. Settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_words_normalized ON words(normalized_word);
      CREATE INDEX IF NOT EXISTS idx_review_cards_due ON review_cards(due);
      CREATE INDEX IF NOT EXISTS idx_words_favorite ON words(favorite);
    `
  }
];
