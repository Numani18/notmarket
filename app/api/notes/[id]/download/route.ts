import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notify'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = await getDb()
  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const filePath = path.join(process.cwd(), 'public', note.file_path)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  await db.prepare('UPDATE notes SET downloads = downloads + 1 WHERE id = ?').run(params.id)

  // Her 5 indirmede bir not sahibine bildirim (spam olmasın diye)
  if (note.seller_id !== session.id) {
    const newCount = (note.downloads || 0) + 1
    if (newCount === 1 || newCount % 5 === 0) {
      await createNotification(
        note.seller_id,
        'download',
        `"${note.title}" notun ${newCount} kez indirildi 🎉`,
        `/note/${params.id}`
      )
    }
  }

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(note.title)}.pdf"`,
    },
  })
}
