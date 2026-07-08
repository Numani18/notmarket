import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const db = getDb()
  const reports = db.prepare(`
    SELECT r.*, n.title as note_title, n.status as note_status, u.name as reporter_name
    FROM reports r
    JOIN notes n ON n.id = r.note_id
    JOIN users u ON u.id = r.user_id
    WHERE r.status = 'open'
    ORDER BY r.created_at DESC
    LIMIT 100
  `).all() as any[]

  return NextResponse.json({ reports })
}
