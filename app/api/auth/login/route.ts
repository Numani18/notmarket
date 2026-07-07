import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 })
    }

    const db = getDb()
    const user = db
      .prepare('SELECT id, name, email, password FROM users WHERE email = ?')
      .get(email) as any

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name })
    cookies().set('auth_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
