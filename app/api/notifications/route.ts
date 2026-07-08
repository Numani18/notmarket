import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ notifications: [], unread: 0 })

  const db = getDb()
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30'
  ).all(session.id) as any[]

  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(session.id) as any

  return NextResponse.json({ notifications, unread: unread?.c || 0 })
}

// Tümünü okundu işaretle
export async function POST() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = getDb()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.id)
  return NextResponse.json({ success: true })
}
