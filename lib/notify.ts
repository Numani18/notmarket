import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export function createNotification(userId: string, type: string, message: string, link?: string) {
  try {
    const db = getDb()
    db.prepare('INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), userId, type, message, link || null)
  } catch {
    // bildirim hatası ana akışı bozmasın
  }
}

export function notifyAdmins(type: string, message: string, link?: string) {
  try {
    const db = getDb()
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[]
    for (const a of admins) createNotification(a.id, type, message, link)
  } catch {}
}
