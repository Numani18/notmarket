import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

const SECRET = process.env.JWT_SECRET || 'notmarket-secret-change-in-prod'

export interface TokenPayload {
  id: string
  email: string
  name: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function getSession(): TokenPayload | null {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

// Oturumdaki kullanıcının admin olup olmadığını veritabanından kontrol eder
export function isAdmin(): boolean {
  const session = getSession()
  if (!session) return false
  try {
    const db = getDb()
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(session.id) as any
    return user?.role === 'admin'
  } catch {
    return false
  }
}
