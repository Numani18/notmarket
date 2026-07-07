import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = getDb()
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND status = ?').get(noteId, 'active') as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  if (note.seller_id === session.id) {
    return NextResponse.json({ error: 'Kendi notunu satın alamazsın' }, { status: 400 })
  }

  const existing = db
    .prepare('SELECT id FROM purchases WHERE buyer_id = ? AND note_id = ?')
    .get(session.id, noteId)
  if (existing) {
    return NextResponse.json({ error: 'Bu notu zaten satın aldın', alreadyOwned: true }, { status: 409 })
  }

  const platformFee = Math.round(note.price * 0.15 * 100) / 100
  const purchaseId = uuid()

  db.prepare(`
    INSERT INTO purchases (id, buyer_id, note_id, amount, platform_fee)
    VALUES (?, ?, ?, ?, ?)
  `).run(purchaseId, session.id, noteId, note.price, platformFee)

  return NextResponse.json({ success: true, purchaseId })
}
