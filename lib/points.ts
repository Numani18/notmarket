import { getDb } from '@/lib/db'

// Puan ekonomisi: not yükleyerek kazan, AI'da harca
export const POINTS = {
  START: 50,        // yeni kullanıcı başlangıç puanı
  UPLOAD: 20,       // not yükleme ödülü
  DOWNLOAD: 2,      // notun başkası tarafından indirilmesi ödülü
  COST_SUMMARY: 10, // AI özet maliyeti
  COST_QUIZ: 10,    // AI quiz maliyeti
  COST_CHAT: 2,     // AI asistan (mesaj başına) maliyeti
}

export async function getPoints(userId: string): Promise<number> {
  const db = await getDb()
  const row = await db.prepare('SELECT points FROM users WHERE id = ?').get(userId) as any
  return row?.points ?? 0
}

export async function addPoints(userId: string, amount: number): Promise<void> {
  const db = await getDb()
  await db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(amount, userId)
}

// Yeterli puan varsa düşer ve true döner; yoksa dokunmaz false döner
export async function spendPoints(userId: string, amount: number): Promise<{ ok: boolean; balance: number }> {
  const db = await getDb()
  const current = await getPoints(userId)
  if (current < amount) return { ok: false, balance: current }
  await db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(amount, userId)
  return { ok: true, balance: current - amount }
}
