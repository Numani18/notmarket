import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')

  const db = await getDb()

  if (noteId) {
    const fav = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND note_id = ?').get(session.id, noteId)
    return NextResponse.json({ saved: !!fav })
  }

  const notes = await db.prepare(`
    SELECT n.*, u.name as seller_name
    FROM favorites f
    JOIN notes n ON n.id = f.note_id
    JOIN users u ON u.id = n.seller_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(session.id)

  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = await getDb()
  const existing = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND note_id = ?').get(session.id, noteId)

  if (existing) {
    await db.prepare('DELETE FROM favorites WHERE user_id = ? AND note_id = ?').run(session.id, noteId)
    return NextResponse.json({ saved: false })
  }

  await db.prepare('INSERT INTO favorites (id, user_id, note_id) VALUES (?, ?, ?)').run(uuid(), session.id, noteId)
  return NextResponse.json({ saved: true })
}
