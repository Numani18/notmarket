import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notify'
import { downloadPdf, objectNameFromUrl } from '@/lib/storage'
import { addPoints, POINTS } from '@/lib/points'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = await getDb()
  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  let fileBuffer: Buffer
  try {
    fileBuffer = await downloadPdf(objectNameFromUrl(note.file_path))
  } catch {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  await db.prepare('UPDATE notes SET downloads = downloads + 1 WHERE id = ?').run(params.id)

  // Başkası indirince not sahibine puan ödülü
  if (note.seller_id !== session.id) {
    await addPoints(note.seller_id, POINTS.DOWNLOAD)
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

  return new NextResponse(fileBuffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(note.title)}.pdf"`,
    },
  })
}
