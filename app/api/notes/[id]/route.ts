import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb()
  const note = await db
    .prepare(`
      SELECT n.*, u.name as seller_name
      FROM notes n
      JOIN users u ON u.id = n.seller_id
      WHERE n.id = ?
    `)
    .get(params.id) as any

  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const session = getSession()
  // Notlar ücretsiz — giriş yapan herkes erişebilir
  const owned = !!session

  return NextResponse.json({ note, owned })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = await getDb()
  const note = await db.prepare('SELECT seller_id FROM notes WHERE id = ?').get(params.id) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
  if (note.seller_id !== session.id) return NextResponse.json({ error: 'Bu notu düzenleme yetkin yok' }, { status: 403 })

  const body = await req.json()
  const { title, description, course, instructor } = body

  await db.prepare('UPDATE notes SET title = ?, description = ?, course = ?, instructor = ? WHERE id = ?')
    .run(title, description, course, instructor, params.id)

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = await getDb()
  const note = await db.prepare('SELECT seller_id, file_path FROM notes WHERE id = ?').get(params.id) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
  if (note.seller_id !== session.id) return NextResponse.json({ error: 'Bu notu silme yetkin yok' }, { status: 403 })

  await db.prepare('DELETE FROM reviews WHERE note_id = ?').run(params.id)
  await db.prepare('DELETE FROM favorites WHERE note_id = ?').run(params.id)
  await db.prepare('DELETE FROM ai_summaries WHERE note_id = ?').run(params.id)
  await db.prepare('DELETE FROM notes WHERE id = ?').run(params.id)

  try {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', note.file_path)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}

  return NextResponse.json({ success: true })
}
