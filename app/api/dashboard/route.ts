import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const myNotes = await db
    .prepare(`
      SELECT n.*, u.name as seller_name
      FROM notes n
      JOIN users u ON u.id = n.seller_id
      WHERE n.seller_id = ?
      ORDER BY n.created_at DESC
    `)
    .all(session.id)

  return NextResponse.json({ myNotes })
}
