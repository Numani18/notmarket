import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { extractPdfTextFromBuffer } from '@/lib/pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Kullanıcının kendi PDF'inden metin çıkarır (kaydetmeden, hızlı çalışma için)
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Giriş yapman gerekiyor' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Dosya okunamadı' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json({ error: 'PDF bulunamadı' }, { status: 400 })
  }
  const file = fileEntry as File
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Yalnızca PDF yükleyebilirsin' }, { status: 400 })
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Dosya 50 MB\'ı aşamaz' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractPdfTextFromBuffer(buffer, 12000)
    return NextResponse.json({ text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
}
