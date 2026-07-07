import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()

  const myNotes = db
    .prepare(`
      SELECT n.*, u.name as seller_name
      FROM notes n
      JOIN users u ON u.id = n.seller_id
      WHERE n.seller_id = ?
      ORDER BY n.created_at DESC
    `)
    .all(session.id)

  const purchases = db
    .prepare(`
      SELECT n.*, u.name as seller_name
      FROM purchases p
      JOIN notes n ON n.id = p.note_id
      JOIN users u ON u.id = n.seller_id
      WHERE p.buyer_id = ?
      ORDER BY p.created_at DESC
    `)
    .all(session.id)

  return NextResponse.json({ myNotes, purchases })
}
