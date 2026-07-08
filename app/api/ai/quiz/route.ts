import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { generateQuiz } from '@/lib/claude'
import { checkAndConsume } from '@/lib/ai-limit'
import { extractPdfTextFromBuffer } from '@/lib/pdf'
import { downloadPdf, objectNameFromUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')
  const fresh = searchParams.get('fresh') === '1'
  if (!noteId) return NextResponse.json({ error: 'noteId gerekli' }, { status: 400 })

  const db = await getDb()
  const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any
  if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  // "Yenile" istenmedikçe önbellekten dön
  if (!fresh) {
    const cached = await db.prepare('SELECT questions FROM ai_quizzes WHERE note_id = ?').get(noteId) as any
    if (cached) {
      return NextResponse.json({ questions: JSON.parse(cached.questions) })
    }
  }

  // Yeni üretim — günlük limiti kontrol et
  const limit = await checkAndConsume(session.id, 'quiz')
  if (!limit.ok) {
    return NextResponse.json({ error: `Günlük AI quiz limitine ulaştın (${limit.limit}). Yarın tekrar dene.` }, { status: 429 })
  }

  let text: string
  try {
    const buffer = await downloadPdf(objectNameFromUrl(note.file_path))
    text = await extractPdfTextFromBuffer(buffer, 8000)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }

  try {
    const questions = await generateQuiz(text)
    const { v4: uuid } = await import('uuid')
    // Önbelleğe yaz (varsa güncelle)
    await db.prepare('DELETE FROM ai_quizzes WHERE note_id = ?').run(noteId)
    await db.prepare('INSERT INTO ai_quizzes (id, note_id, questions) VALUES (?, ?, ?)')
      .run(uuid(), noteId, JSON.stringify(questions))
    return NextResponse.json({ questions })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
