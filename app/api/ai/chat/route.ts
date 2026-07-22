import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { chatWithNote } from '@/lib/claude'
import { spendPoints, POINTS } from '@/lib/points'
import { extractPdfTextFromBuffer } from '@/lib/pdf'
import { downloadPdf, objectNameFromUrl } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { noteId, messages, question } = await req.json()
  if (!noteId || !question) return NextResponse.json({ error: 'noteId ve question gerekli' }, { status: 400 })

  const spent = await spendPoints(session.id, POINTS.COST_CHAT)
  if (!spent.ok) {
    return NextResponse.json({ error: `Yeterli puanın yok (${POINTS.COST_CHAT} puan gerekli, ${spent.balance} puanın var). Not yükleyerek puan kazan!` }, { status: 402 })
  }

  const db = await getDb()
  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  let noteText: string
  try {
    const buffer = await downloadPdf(objectNameFromUrl(note.file_path))
    noteText = await extractPdfTextFromBuffer(buffer, 8000)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }

  try {
    const answer = await chatWithNote(noteText, messages || [], question)
    return NextResponse.json({ answer })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
