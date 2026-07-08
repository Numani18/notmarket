import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { getDb } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, university, department } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ad, e-posta ve şifre zorunludur' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    }

    const db = await getDb()
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 })
    }

    const id = uuid()
    const hash = await bcrypt.hash(password, 10)
    await db.prepare(
      'INSERT INTO users (id, name, email, password, university, department) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, hash, university || null, department || null)

    const token = signToken({ id, email, name })
    cookies().set('auth_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true, user: { id, name, email } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
