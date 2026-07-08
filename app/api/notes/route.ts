import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// Türkçe karakterleri ASCII'ye katlar ve küçük harfe çevirir.
// "İSTANBUL", "istanbul", "Istanbul", "ıstanbul" hepsi aynı sonuca iner.
function normalizeTr(s: string): string {
  return s
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .toLowerCase()
}

// Aynı normalizasyonu SQL tarafında bir sütuna uygular (SQLite LOWER Türkçe'yi bilmez).
function normSql(col: string): string {
  return `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(`
    + col +
    `,'İ','i'),'I','i'),'ı','i'),'Ş','s'),'ş','s'),'Ç','c'),'ç','c'),'Ğ','g'),'ğ','g'),'Ö','o'),'ö','o'),'Ü','u'))`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  const university = searchParams.get('university')?.trim() || ''
  const department = searchParams.get('department')?.trim() || ''
  const course = searchParams.get('course')?.trim() || ''
  const type = searchParams.get('type') || ''
  const school_type = searchParams.get('school_type') || ''
  const sort = searchParams.get('sort') || 'newest'

  const db = getDb()

  const conditions: string[] = ["n.status = 'active'"]
  const params: any[] = []

  if (q) {
    // Sorguyu kelimelere böl, her kelime herhangi bir alanda geçmeli (AND)
    const words = normalizeTr(q).split(/\s+/).filter(Boolean)
    for (const w of words) {
      const like = `%${w}%`
      conditions.push(`(
        ${normSql('n.title')} LIKE ? OR
        ${normSql('n.description')} LIKE ? OR
        ${normSql('n.course')} LIKE ? OR
        ${normSql('n.department')} LIKE ? OR
        ${normSql('n.university')} LIKE ? OR
        ${normSql('n.instructor')} LIKE ?
      )`)
      params.push(like, like, like, like, like, like)
    }
  }
  if (university) {
    conditions.push(`${normSql('n.university')} LIKE ?`)
    params.push(`%${normalizeTr(university)}%`)
  }
  if (department) {
    conditions.push(`${normSql('n.department')} LIKE ?`)
    params.push(`%${normalizeTr(department)}%`)
  }
  if (course) {
    conditions.push(`${normSql('n.course')} LIKE ?`)
    params.push(`%${normalizeTr(course)}%`)
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
    rating: 'n.rating DESC',
  }
  const order = orderMap[sort] || 'n.created_at DESC'

  const where = `WHERE ${conditions.join(' AND ')}`
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
