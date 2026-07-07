import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { chatWithNote } from '@/lib/claude'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId, messages, question } = await req.json()
  if (!noteId || !question) return NextResponse.json({ error: 'noteId ve question gerekli' }, { status: 400 })

  const db = getDb()
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const filePath = path.join(process.cwd(), 'public', note.file_path)
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

  const noteText = fs.readFileSync(filePath).toString('utf8')

  try {
    const answer = await chatWithNote(noteText, messages || [], question)
    return NextResponse.json({ answer })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
