import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

// Kullanıcı başına günlük AI kullanım limitleri
export const AI_LIMITS: Record<string, number> = {
  summary: 15,
  quiz: 15,
  chat: 40,
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getUsage(userId: string, kind: string): number {
  const db = getDb()
  const row = db.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND day = ? AND kind = ?')
    .get(userId, today(), kind) as any
  return row?.count || 0
}

// Limit aşıldıysa false döner, aşılmadıysa sayacı artırıp true döner
export function checkAndConsume(userId: string, kind: string): { ok: boolean; used: number; limit: number } {
  const db = getDb()
  const limit = AI_LIMITS[kind] ?? 20
  const used = getUsage(userId, kind)

  if (used >= limit) {
    return { ok: false, used, limit }
  }

  const existing = db.prepare('SELECT id FROM ai_usage WHERE user_id = ? AND day = ? AND kind = ?')
    .get(userId, today(), kind) as any

  if (existing) {
    db.prepare('UPDATE ai_usage SET count = count + 1 WHERE id = ?').run(existing.id)
  } else {
    db.prepare('INSERT INTO ai_usage (id, user_id, day, kind, count) VALUES (?, ?, ?, ?, 1)')
      .run(uuid(), userId, today(), kind)
  }

  return { ok: true, used: used + 1, limit }
}
