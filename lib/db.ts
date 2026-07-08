// Turso (libSQL) — kalıcı bulut veritabanı.
// Eski node:sqlite senkron API'sine benzer bir async sarmalayıcı sunar:
//   const db = await getDb()
//   await db.prepare(sql).get(...args)
//   await db.prepare(sql).all(...args)
//   await db.prepare(sql).run(...args)
import { createClient, type Client, type InValue } from '@libsql/client'

let _client: Client | null = null
let _initPromise: Promise<void> | null = null

function rawClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!url) throw new Error('TURSO_DATABASE_URL tanımlı değil')
    _client = createClient({ url, authToken })
  }
  return _client
}

// Geçici ağ hatalarında (DNS/timeout/reset) otomatik tekrar dener
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const msg = String(err?.message || '') + String(err?.cause?.code || '') + String(err?.code || '')
      const transient = /fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|CONNECT_TIMEOUT|EAI_AGAIN|503|network/i.test(msg)
      if (!transient || i === retries - 1) break
      await new Promise((r) => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}

// undefined -> null, boolean -> 0/1 (libSQL undefined/boolean kabul etmez)
function normArgs(args: any[]): InValue[] {
  return args.map((a) => {
    if (a === undefined) return null
    if (typeof a === 'boolean') return a ? 1 : 0
    return a as InValue
  })
}

class Statement {
  constructor(private c: Client, private sql: string) {}

  async get(...args: any[]): Promise<any> {
    const r = await withRetry(() => this.c.execute({ sql: this.sql, args: normArgs(args) }))
    return r.rows[0] ?? undefined
  }

  async all(...args: any[]): Promise<any[]> {
    const r = await withRetry(() => this.c.execute({ sql: this.sql, args: normArgs(args) }))
    return r.rows as any[]
  }

  async run(...args: any[]): Promise<{ changes: number; lastInsertRowid: bigint | undefined }> {
    const r = await withRetry(() => this.c.execute({ sql: this.sql, args: normArgs(args) }))
    return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid }
  }
}

class Db {
  constructor(private c: Client) {}
  prepare(sql: string): Statement {
    return new Statement(this.c, sql)
  }
}

export async function getDb(): Promise<Db> {
  const c = rawClient()
  if (!_initPromise) _initPromise = initSchema(c)
  await _initPromise
  return new Db(c)
}

async function initSchema(db: Client) {
  await withRetry(() => db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      university  TEXT,
      department  TEXT,
      balance     REAL NOT NULL DEFAULT 0,
      role        TEXT NOT NULL DEFAULT 'user',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id            TEXT PRIMARY KEY,
      seller_id     TEXT NOT NULL,
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
      school_type   TEXT NOT NULL DEFAULT 'universite',
      school_grade  TEXT,
      report_count  INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      rating     INTEGER NOT NULL,
      comment    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL,
      summary    TEXT NOT NULL,
      key_topics TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      note_id    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, note_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      reason     TEXT NOT NULL,
      detail     TEXT,
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      type       TEXT NOT NULL,
      message    TEXT NOT NULL,
      link       TEXT,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      day        TEXT NOT NULL,
      kind       TEXT NOT NULL,
      count      INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, day, kind)
    );

    CREATE TABLE IF NOT EXISTS ai_quizzes (
      id         TEXT PRIMARY KEY,
      note_id    TEXT NOT NULL,
      questions  TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(note_id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_university ON notes(university);
    CREATE INDEX IF NOT EXISTS idx_notes_department ON notes(department);
    CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `))

  // Admin bootstrap
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try {
      await withRetry(() => db.execute({ sql: "UPDATE users SET role = 'admin' WHERE email = ?", args: [adminEmail] }))
    } catch {}
  }
}
