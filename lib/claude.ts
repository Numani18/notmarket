import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function summarizeNote(text: string): Promise<{
  summary: string
  keyTopics: string[]
  likelySyllabus: string[]
}> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Sen bir Türk üniversite öğrencisine yardımcı olan akademik asistansın.
Ders notlarını analiz ederek öğrencilere faydalı özetler çıkarırsın.
Her zaman Türkçe yanıt verirsin. JSON formatında yanıt verirsin.`,
    messages: [
      {
        role: 'user',
        content: `Aşağıdaki ders notunu analiz et ve şu formatta JSON döndür:
{
  "summary": "notun kapsamlı özeti (3-5 paragraf)",
  "keyTopics": ["konu1", "konu2", ...],
  "likelySyllabus": ["sınavda çıkabilecek konu1", ...]
}

DERS NOTU:
${text.slice(0, 8000)}`,
      },
    ],
  })

  const content = msg.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

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
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `Sen bir Türk üniversite öğrencisine yardımcı olan akademik asistansın.
Ders notlarına göre çoktan seçmeli quiz soruları üretirsin.
Her zaman Türkçe yanıt verirsin. JSON formatında yanıt verirsin.`,
    messages: [
      {
        role: 'user',
        content: `Aşağıdaki ders notuna göre 10 adet çoktan seçmeli soru üret.
Şu formatta JSON döndür:
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
${text.slice(0, 6000)}`,
      },
    ],
  })

  const content = msg.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array in response')

  return JSON.parse(jsonMatch[0])
}

export async function chatWithNote(
  noteText: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  question: string
): Promise<string> {
  const allMessages = [
    ...messages.slice(-6),
    { role: 'user' as const, content: question },
  ]

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `Sen bir Türk üniversite öğrencisine ders notuna göre yardımcı olan kişisel asistansın.
SADECE aşağıdaki ders notundaki bilgileri kullanarak sorulara cevap ver.
Notlarda bulunmayan konular için "Bu konu notlarda bulunmuyor" de.
Her zaman Türkçe yanıt ver. Kısa ve öz ol.

DERS NOTU:
${noteText.slice(0, 6000)}`,
    messages: allMessages,
  })

  const content = msg.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
