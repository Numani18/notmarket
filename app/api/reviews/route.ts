import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { createNotification } from '@/lib/notify'
import { v4 as uuid } from 'uuid'

// GET /api/reviews?noteId=xxx — notun yorumlarını getir
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = await getDb()
  const reviews = await db.prepare(`
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

  const db = await getDb()

  const note = await db.prepare('SELECT seller_id, title FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  // Kendi notuna yorum yapamaz
  if (note.seller_id === session.id) {
    return NextResponse.json({ error: 'Kendi notuna yorum yapamazsın' }, { status: 403 })
  }

  // Daha önce yorum yapmış mı?
  const existing = await db.prepare(
    'SELECT id FROM reviews WHERE note_id = ? AND user_id = ?'
  ).get(noteId, session.id)

  if (existing) {
    // Güncelle
    await db.prepare(
      'UPDATE reviews SET rating = ?, comment = ? WHERE note_id = ? AND user_id = ?'
    ).run(rating, comment || null, noteId, session.id)
  } else {
    // Yeni ekle
    await db.prepare(
      'INSERT INTO reviews (id, note_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(uuid(), noteId, session.id, rating, comment || null)
  }

  // Notun ortalama puanını güncelle
  const stats = await db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE note_id = ?'
  ).get(noteId) as any

  await db.prepare(
    'UPDATE notes SET rating = ?, rating_count = ? WHERE id = ?'
  ).run(
    Math.round(stats.avg * 10) / 10,
    stats.cnt,
    noteId
  )

  // Yeni yorumda not sahibine bildirim gönder
  if (!existing) {
    const reviewer = await db.prepare('SELECT name FROM users WHERE id = ?').get(session.id) as any
    await createNotification(
      note.seller_id,
      'review',
      `${reviewer?.name || 'Bir kullanıcı'} "${note.title}" notuna ${rating}★ verdi`,
      `/note/${noteId}`
    )
  }

  return NextResponse.json({ success: true })
}
