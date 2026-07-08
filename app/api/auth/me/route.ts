import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ user: null })

  const db = getDb()
  const user = db
    .prepare('SELECT id, name, email, university, department, balance, role FROM users WHERE id = ?')
    .get(session.id) as any

  return NextResponse.json({ user: user || null })
}

// Kullanıcı profil bilgisini günceller (onboarding + profil düzenleme)
export async function PATCH(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  const body = await req.json()
  const { university, department } = body
  const db = getDb()

  // Ad da gönderildiyse güncelle (boş olamaz)
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (name.length < 2) return NextResponse.json({ error: 'Ad en az 2 karakter olmalı' }, { status: 400 })
    db.prepare('UPDATE users SET name = ?, university = ?, department = ? WHERE id = ?')
      .run(name, university || null, department || null, session.id)
  } else {
    db.prepare('UPDATE users SET university = ?, department = ? WHERE id = ?')
      .run(university || null, department || null, session.id)
  }

  return NextResponse.json({ success: true })
}
