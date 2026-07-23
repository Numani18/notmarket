import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { summarizeNote, generateQuiz, chatWithNote } from '@/lib/claude'
import { spendPoints, POINTS } from '@/lib/points'

export const dynamic = 'force-dynamic'

// Kullanıcının kendi metni üzerinde AI (özet / quiz / asistan) — kaydetmeden
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const { action, text, messages, question } = await req.json()
  if (!text || !action) return NextResponse.json({ error: 'Metin ve işlem gerekli' }, { status: 400 })

  const cost = action === 'summary' ? POINTS.COST_SUMMARY
    : action === 'quiz' ? POINTS.COST_QUIZ
    : POINTS.COST_CHAT

  const spent = await spendPoints(session.id, cost)
  if (!spent.ok) {
    return NextResponse.json({ error: `Yeterli puanın yok (${cost} puan gerekli, ${spent.balance} puanın var). Not yükleyerek puan kazan!` }, { status: 402 })
  }

  try {
    if (action === 'summary') {
      const result = await summarizeNote(text)
      return NextResponse.json(result)
    }
    if (action === 'quiz') {
      const questions = await generateQuiz(text)
      return NextResponse.json({ questions })
    }
    if (action === 'chat') {
      if (!question) return NextResponse.json({ error: 'Soru gerekli' }, { status: 400 })
      const answer = await chatWithNote(text, messages || [], question)
      return NextResponse.json({ answer })
    }
    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI hatası: ' + err.message }, { status: 500 })
  }
}
