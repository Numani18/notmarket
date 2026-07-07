import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'

// GET /api/reviews?noteId=xxx — notun yorumlarını getir
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = getDb()
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.note_id = ?
    ORDER BY r.created_at DESC
  `).all(noteId)

  return NextResponse.json({ reviews })
}

// POST /api/reviews — yorum ekle
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId, rating, comment } = await req.json()

  if (!noteId || !rating) return NextResponse.json({ error: 'noteId ve rating zorunlu' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Puan 1-5 arası olmalı' }, { status: 400 })

  const db = getDb()

  // Satın almış mı kontrol et
  const note = db.prepare('SELECT seller_id FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const hasPurchase = db.prepare(
    'SELECT id FROM purchases WHERE buyer_id = ? AND note_id = ?'
  ).get(session.id, noteId)

  if (note.seller_id !== session.id && !hasPurchase) {
    return NextResponse.json({ error: 'Yorum yapabilmek için notu satın alman gerekiyor' }, { status: 403 })
  }

  // Daha önce yorum yapmış mı?
  const existing = db.prepare(
    'SELECT id FROM reviews WHERE note_id = ? AND user_id = ?'
  ).get(noteId, session.id)

  if (existing) {
    // Güncelle
    db.prepare(
      'UPDATE reviews SET rating = ?, comment = ? WHERE note_id = ? AND user_id = ?'
    ).run(rating, comment || null, noteId, session.id)
  } else {
    // Yeni ekle
    db.prepare(
      'INSERT INTO reviews (id, note_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(uuid(), noteId, session.id, rating, comment || null)
  }

  // Notun ortalama puanını güncelle
  const stats = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE note_id = ?'
  ).get(noteId) as any

  db.prepare(
    'UPDATE notes SET rating = ?, rating_count = ? WHERE id = ?'
  ).run(
    Math.round(stats.avg * 10) / 10,
    stats.cnt,
    noteId
  )

  return NextResponse.json({ success: true })
}
