import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const db = getDb()
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const filePath = path.join(process.cwd(), 'public', note.file_path)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  db.prepare('UPDATE notes SET downloads = downloads + 1 WHERE id = ?').run(params.id)

  const fileBuffer = fs.readFileSync(filePath)
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(note.title)}.pdf"`,
    },
  })
}
