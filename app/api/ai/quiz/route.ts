import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { generateQuiz } from '@/lib/claude'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = getDb()
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const filePath = path.join(process.cwd(), 'public', note.file_path)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  const text = fs.readFileSync(filePath).toString('utf8').slice(0, 8000)

  try {
    const questions = await generateQuiz(text)
    return NextResponse.json({ questions })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
