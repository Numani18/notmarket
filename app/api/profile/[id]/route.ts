import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()

  const user = db.prepare('SELECT id, name, university, department, created_at FROM users WHERE id = ?')
    .get(params.id) as any
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const notes = db.prepare(`
    SELECT n.*, u.name as seller_name
    FROM notes n JOIN users u ON u.id = n.seller_id
    WHERE n.seller_id = ? AND n.status = 'active'
    ORDER BY n.downloads DESC, n.created_at DESC
  `).all(params.id) as any[]

  const totalDownloads = notes.reduce((s, n) => s + n.downloads, 0)
  const rated = notes.filter(n => n.rating)
  const avgRating = rated.length > 0
    ? (rated.reduce((s, n) => s + n.rating, 0) / rated.length)
    : null

  return NextResponse.json({
    user,
    notes,
    stats: { noteCount: notes.length, totalDownloads, avgRating },
  })
}
