import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err: any) {
    return NextResponse.json({ error: 'Form verisi okunamadı: ' + err.message }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json({ error: 'PDF dosyası bulunamadı' }, { status: 400 })
  }

  const file = fileEntry as File
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Yalnızca PDF dosyası kabul edilir' }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Dosya boyutu 50 MB\'ı aşamaz' }, { status: 400 })
  }

  const get = (key: string) => {
    const val = formData.get(key)
    return typeof val === 'string' ? val.trim() : ''
  }

  const title = get('title')
  const university = get('university')
  const department = get('department')
  const course = get('course')
  const school_type = get('school_type') || 'universite'
  const school_grade = get('school_grade')

  if (!title || !university || !department || !course) {
    return NextResponse.json({ error: 'Başlık, okul, sınıf/bölüm ve ders adı zorunludur' }, { status: 400 })
  }

  const price = 0

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const noteId = uuid()
  const fileName = `${noteId}.pdf`
  const destPath = path.join(uploadDir, fileName)

  try {
    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer))
  } catch (err: any) {
    return NextResponse.json({ error: 'Dosya kaydedilemedi: ' + err.message }, { status: 500 })
  }

  try {
    const db = getDb()
    db.prepare(`
      INSERT INTO notes (id, seller_id, title, description, university, faculty, department, course, instructor, type, price, file_path, school_type, school_grade)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      noteId,
      session.id,
      title,
      get('description'),
      university,
      get('faculty'),
      department,
      course,
      get('instructor'),
      get('type') || 'notes',
      price,
      `/uploads/${fileName}`,
      school_type,
      school_grade
    )
  } catch (err: any) {
    fs.unlinkSync(destPath)
    return NextResponse.json({ error: 'Veritabanı hatası: ' + err.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, noteId })
}
