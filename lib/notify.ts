import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function createNotification(userId: string, type: string, message: string, link?: string) {
  try {
    const db = await getDb()
    await db.prepare('INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), userId, type, message, link || null)
  } catch {
    // bildirim hatası ana akışı bozmasın
  }
}

export async function notifyAdmins(type: string, message: string, link?: string) {
  try {
    const db = await getDb()
    const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[]
    for (const a of admins) await createNotification(a.id, type, message, link)
  } catch {}
}
