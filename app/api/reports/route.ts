import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { notifyAdmins } from '@/lib/notify'
import { v4 as uuid } from 'uuid'

const REASONS = ['telif', 'kalitesiz', 'yanlis_kategori', 'spam', 'diger']
const AUTO_HIDE_THRESHOLD = 3

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId, reason, detail } = await req.json()
  if (!noteId || !reason) return NextResponse.json({ error: 'noteId ve sebep gerekli' }, { status: 400 })
  if (!REASONS.includes(reason)) return NextResponse.json({ error: 'Geçersiz sebep' }, { status: 400 })

  const db = await getDb()
  const note = await db.prepare('SELECT id, title, report_count FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const existing = await db.prepare('SELECT id FROM reports WHERE note_id = ? AND user_id = ?').get(noteId, session.id)
  if (existing) return NextResponse.json({ error: 'Bu notu zaten şikayet ettin' }, { status: 409 })

  await db.prepare('INSERT INTO reports (id, note_id, user_id, reason, detail) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), noteId, session.id, reason, detail || null)

  const newCount = (note.report_count || 0) + 1
  await db.prepare('UPDATE notes SET report_count = ? WHERE id = ?').run(newCount, noteId)

  // Eşiği geçince otomatik gizle
  if (newCount >= AUTO_HIDE_THRESHOLD) {
    await db.prepare("UPDATE notes SET status = 'hidden' WHERE id = ?").run(noteId)
  }

  await notifyAdmins('report', `"${note.title}" notu şikayet edildi (${newCount} şikayet)`, '/admin')

  return NextResponse.json({ success: true })
}
