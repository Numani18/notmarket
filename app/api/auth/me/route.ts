import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ user: null })

  const db = getDb()
  const user = db
    .prepare('SELECT id, name, email, university, department, balance FROM users WHERE id = ?')
    .get(session.id) as any

  return NextResponse.json({ user: user || null })
}
