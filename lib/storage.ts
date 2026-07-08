// Supabase Storage — yüklenen PDF'lerin kalıcı bulut deposu.
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'notes'

let _client: ReturnType<typeof createClient> | null = null

function client() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY tanımlı değil')
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}

// PDF'i yükler, herkese açık URL'yi döner
export async function uploadPdf(objectName: string, buffer: Buffer): Promise<string> {
  const { error } = await client().storage.from(BUCKET).upload(objectName, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw new Error('Dosya yüklenemedi: ' + error.message)

  const { data } = client().storage.from(BUCKET).getPublicUrl(objectName)
  return data.publicUrl
}

// PDF içeriğini indirir (AI/indirme için sunucuda okuma)
export async function downloadPdf(objectName: string): Promise<Buffer> {
  const { data, error } = await client().storage.from(BUCKET).download(objectName)
  if (error || !data) throw new Error('Dosya bulunamadı: ' + (error?.message || ''))
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Depodan siler
export async function deletePdf(objectName: string): Promise<void> {
  await client().storage.from(BUCKET).remove([objectName])
}

// Herkese açık URL'den depo yolunu (obje adını) çıkarır
export function objectNameFromUrl(url: string): string {
  const marker = `/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return url.split('/').pop() || url
  return url.slice(i + marker.length)
}
