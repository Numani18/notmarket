import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { summarizeNote } from '@/lib/claude'
import { spendPoints, POINTS } from '@/lib/points'
import { extractPdfTextFromBuffer } from '@/lib/pdf'
import { downloadPdf, objectNameFromUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = await getDb()
  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const cached = await db.prepare('SELECT * FROM ai_summaries WHERE note_id = ?').get(noteId) as any
  if (cached) {
    return NextResponse.json({ summary: cached.summary, keyTopics: JSON.parse(cached.key_topics) })
  }

  // Cache yoksa yeni üretim — puan harca
  const spent = await spendPoints(session.id, POINTS.COST_SUMMARY)
  if (!spent.ok) {
    return NextResponse.json({ error: `Yeterli puanın yok (${POINTS.COST_SUMMARY} puan gerekli, ${spent.balance} puanın var). Not yükleyerek puan kazan!` }, { status: 402 })
  }

  let text: string
  try {
    const buffer = await downloadPdf(objectNameFromUrl(note.file_path))
    text = await extractPdfTextFromBuffer(buffer, 10000)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }

  try {
    const result = await summarizeNote(text)
    const { v4: uuid } = await import('uuid')
    await db.prepare('INSERT INTO ai_summaries (id, note_id, summary, key_topics) VALUES (?, ?, ?, ?)')
      .run(uuid(), noteId, result.summary, JSON.stringify(result.keyTopics))
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
