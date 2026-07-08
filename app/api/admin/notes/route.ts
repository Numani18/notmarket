import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all' // all | reported | hidden

  const db = getDb()
  let where = ''
  if (filter === 'reported') where = 'WHERE n.report_count > 0'
  else if (filter === 'hidden') where = "WHERE n.status = 'hidden'"

  const notes = db.prepare(`
    SELECT n.*, u.name as seller_name, u.email as seller_email
    FROM notes n JOIN users u ON u.id = n.seller_id
    ${where}
    ORDER BY n.report_count DESC, n.created_at DESC
    LIMIT 200
  `).all() as any[]

  return NextResponse.json({ notes })
}

// Notu gizle / göster / sil
export async function PATCH(req: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { noteId, action } = await req.json()
  if (!noteId || !action) return NextResponse.json({ error: 'noteId ve action gerekli' }, { status: 400 })

  const db = getDb()
  const note = db.prepare('SELECT id, file_path FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  if (action === 'hide') {
    db.prepare("UPDATE notes SET status = 'hidden' WHERE id = ?").run(noteId)
  } else if (action === 'show') {
    db.prepare("UPDATE notes SET status = 'active', report_count = 0 WHERE id = ?").run(noteId)
    db.prepare("UPDATE reports SET status = 'resolved' WHERE note_id = ?").run(noteId)
  } else if (action === 'delete') {
    db.prepare('DELETE FROM reports WHERE note_id = ?').run(noteId)
    db.prepare('DELETE FROM favorites WHERE note_id = ?').run(noteId)
    db.prepare('DELETE FROM ai_summaries WHERE note_id = ?').run(noteId)
    db.prepare('DELETE FROM ai_quizzes WHERE note_id = ?').run(noteId)
    db.prepare('DELETE FROM reviews WHERE note_id = ?').run(noteId)
    db.prepare('DELETE FROM notes WHERE id = ?').run(noteId)
    try {
      const fs = await import('fs')
      const path = await import('path')
      const fp = path.join(process.cwd(), 'public', note.file_path)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    } catch {}
  } else {
    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
