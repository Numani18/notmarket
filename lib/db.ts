// Node.js 22+ built-in SQLite (no native compilation needed)
import { DatabaseSync } from 'node:sqlite'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'notmarket.db')

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    _db.exec('PRAGMA journal_mode = WAL')
    _db.exec('PRAGMA foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      university  TEXT,
      department  TEXT,
      balance     REAL NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id            TEXT PRIMARY KEY,
      seller_id     TEXT NOT NULL REFERENCES users(id),
      title         TEXT NOT NULL,
      description   TEXT,
      university    TEXT NOT NULL,
      faculty       TEXT,
      department    TEXT NOT NULL,
      course        TEXT NOT NULL,
      instructor    TEXT,
      type          TEXT NOT NULL,
      price         REAL NOT NULL,
      file_path     TEXT NOT NULL,
      preview_path  TEXT,
      page_count    INTEGER,
      downloads     INTEGER NOT NULL DEFAULT 0,
      rating        REAL,
      rating_count  INTEGER NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'active',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id          TEXT PRIMARY KEY,
      buyer_id    TEXT NOT NULL REFERENCES users(id),
      note_id     TEXT NOT NULL REFERENCES notes(id),
      amount      REAL NOT NULL,
      platform_fee REAL NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(buyer_id, note_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL REFERENCES notes(id),
      user_id    TEXT NOT NULL REFERENCES users(id),
      rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL REFERENCES notes(id),
      summary    TEXT NOT NULL,
      key_topics TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      note_id    TEXT NOT NULL REFERENCES notes(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, note_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL REFERENCES notes(id),
      user_id    TEXT NOT NULL REFERENCES users(id),
      reason     TEXT NOT NULL,
      detail     TEXT,
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      type       TEXT NOT NULL,
      message    TEXT NOT NULL,
      link       TEXT,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      day        TEXT NOT NULL,
      kind       TEXT NOT NULL,
      count      INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, day, kind)
    );

    CREATE TABLE IF NOT EXISTS ai_quizzes (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL REFERENCES notes(id),
      questions  TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_university ON notes(university);
    CREATE INDEX IF NOT EXISTS idx_notes_department ON notes(department);
    CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course);
    CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_note ON purchases(note_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `)

  // Migrations for existing databases
  try { db.exec("ALTER TABLE notes ADD COLUMN school_type TEXT NOT NULL DEFAULT 'universite'") } catch {}
  try { db.exec("ALTER TABLE notes ADD COLUMN school_grade TEXT") } catch {}
  try { db.exec("ALTER TABLE notes ADD COLUMN report_count INTEGER NOT NULL DEFAULT 0") } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'") } catch {}

  // Bootstrap admin: first registered user OR the configured admin email
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try { db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail) } catch {}
  }
}
