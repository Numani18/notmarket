import fs from 'fs'

// Buffer'dan PDF metni çıkarır (pdf-parse v2 API).
export async function extractPdfTextFromBuffer(buffer: Buffer, maxChars = 12000): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  const text = (result.text || '').trim()

  if (!text || text.length < 20) {
    throw new Error('PDF içeriğinden metin çıkarılamadı (taranmış/görsel PDF olabilir)')
  }
  return text.slice(0, maxChars)
}

// Yerel dosyadan PDF metni çıkarır (geriye dönük uyumluluk için)
export async function extractPdfText(filePath: string, maxChars = 12000): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error('Dosya bulunamadı')
  return extractPdfTextFromBuffer(fs.readFileSync(filePath), maxChars)
}
