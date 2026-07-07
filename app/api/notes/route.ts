import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const university = searchParams.get('university') || ''
  const department = searchParams.get('department') || ''
  const course = searchParams.get('course') || ''
  const type = searchParams.get('type') || ''
  const school_type = searchParams.get('school_type') || ''
  const sort = searchParams.get('sort') || 'newest'

  const db = getDb()

  const conditions: string[] = ["n.status = 'active'"]
  const params: any[] = []

  if (q) {
    conditions.push('(n.title LIKE ? OR n.description LIKE ? OR n.course LIKE ? OR n.department LIKE ?)')
    const like = `%${q}%`
    params.push(like, like, like, like)
  }
  if (university) {
    conditions.push('n.university LIKE ?')
    params.push(`%${university}%`)
  }
  if (department) {
    conditions.push('n.department LIKE ?')
    params.push(`%${department}%`)
  }
  if (course) {
    conditions.push('n.course LIKE ?')
    params.push(`%${course}%`)
  }
  if (type) {
    conditions.push('n.type = ?')
    params.push(type)
  }
  if (school_type) {
    conditions.push('n.school_type = ?')
    params.push(school_type)
  }

  const orderMap: Record<string, string> = {
    newest: 'n.created_at DESC',
    popular: 'n.downloads DESC',
    price_asc: 'n.price ASC',
    price_desc: 'n.price DESC',
    rating: 'n.rating DESC',
  }
  const order = orderMap[sort] || 'n.created_at DESC'

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `
    SELECT n.*, u.name as seller_name
    FROM notes n
    JOIN users u ON u.id = n.seller_id
    ${where}
    ORDER BY ${order}
    LIMIT 100
  `
  const notes = db.prepare(sql).all(...params)
  return NextResponse.json({ notes })
}
