import { GoogleGenerativeAI } from '@google/generative-ai'

// Google Gemini (ücretsiz) — Claude yerine kullanılıyor.
// Fonksiyon isimleri aynı kaldığı için route'lar değişmedi.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const MODEL = 'gemini-2.5-flash'

// Geçici ağ hatalarında (fetch failed vb.) otomatik tekrar dener
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const msg = String(err?.message || '')
      // Sadece geçici hatalarda tekrar dene
      const transient = msg.includes('fetch failed') || msg.includes('503') || msg.includes('overloaded') || msg.includes('ECONNRESET')
      if (!transient || i === retries - 1) break
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastErr
}

function extractJson(text: string): string {
  // Markdown kod bloğu varsa temizle
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  return cleaned
}

export async function summarizeNote(text: string): Promise<{
  summary: string
  keyTopics: string[]
  likelySyllabus: string[]
}> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `Sen bir Türk öğrencisine yardımcı olan akademik asistansın.
Ders notlarını analiz ederek faydalı özetler çıkarırsın. Her zaman Türkçe yanıt verirsin.
SADECE geçerli JSON döndür, başka açıklama ekleme.`,
  })

  const prompt = `Aşağıdaki ders notunu analiz et ve şu formatta JSON döndür:
{
  "summary": "notun kapsamlı özeti (3-5 paragraf)",
  "keyTopics": ["konu1", "konu2"],
  "likelySyllabus": ["sınavda çıkabilecek konu1", "konu2"]
}

DERS NOTU:
${text.slice(0, 8000)}`

  const result = await withRetry(() => model.generateContent(prompt))
  const raw = extractJson(result.response.text())
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI yanıtı okunamadı')

  const parsed = JSON.parse(jsonMatch[0])
  return {
    summary: parsed.summary || '',
    keyTopics: parsed.keyTopics || [],
    likelySyllabus: parsed.likelySyllabus || [],
  }
}

export async function generateQuiz(text: string): Promise<
  Array<{
    question: string
    options: string[]
    correct: number
    explanation: string
  }>
> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `Sen bir Türk öğrencisine yardımcı olan akademik asistansın.
Ders notlarına göre çoktan seçmeli quiz soruları üretirsin. Her zaman Türkçe yanıt verirsin.
SADECE geçerli JSON dizisi döndür, başka açıklama ekleme.`,
  })

  const prompt = `Aşağıdaki ders notuna göre 10 adet çoktan seçmeli soru üret.
Şu formatta JSON dizisi döndür:
[
  {
    "question": "Soru metni?",
    "options": ["A) seçenek", "B) seçenek", "C) seçenek", "D) seçenek"],
    "correct": 0,
    "explanation": "Neden bu cevap doğru?"
  }
]
correct alanı 0-3 arası index (A=0, B=1, C=2, D=3).

DERS NOTU:
${text.slice(0, 6000)}`

  const result = await withRetry(() => model.generateContent(prompt))
  const raw = extractJson(result.response.text())
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('AI yanıtı okunamadı')

  return JSON.parse(jsonMatch[0])
}

export async function chatWithNote(
  noteText: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  question: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `Sen bir Türk öğrencisine bu ders notu üzerinden yardımcı olan samimi bir çalışma asistanısın.

Görevin:
- Notun içeriğiyle ilgili soruları notu temel alarak açıkla.
- Öğrenci "nasıl çalışmalıyım", "hangi konulara odaklanmalıyım", "bunu bana anlat" gibi sorular sorarsa; notun içeriğine dayanarak çalışma tavsiyesi ve açıklama ver.
- Konuyu daha iyi anlatmak için genel bilgini de kullanabilirsin, ama odağın hep bu not olsun.
- Sadece notla tamamen alakasız (örn. hava durumu) sorularda kibarca konuya dönmesini iste.

Her zaman Türkçe, anlaşılır ve yardımsever yanıt ver.

DERS NOTU:
${noteText.slice(0, 6000)}`,
  })

  // Önceki mesajları Gemini formatına çevir (son 6 mesaj)
  const history = messages.slice(-6).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const result = await withRetry(() => chat.sendMessage(question))
  return result.response.text()
}
