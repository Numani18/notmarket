'use client'

import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface QuizQ { question: string; options: string[]; correct: number; explanation: string }
interface ChatMsg { role: 'user' | 'assistant'; content: string }

export default function QuickStudyPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<any>(undefined)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')

  const [tab, setTab] = useState<'summary' | 'quiz' | 'chat'>('summary')
  const [summary, setSummary] = useState<any>(null)
  const [quiz, setQuiz] = useState<QuizQ[]>([])
  const [quizAns, setQuizAns] = useState<Record<number, number>>({})
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setSession(d.user || null))
  }, [])

  async function handleFile(f: File) {
    if (f.type !== 'application/pdf') { setError('Yalnızca PDF yükleyebilirsin'); return }
    setError(''); setFile(f); setExtracting(true)
    setSummary(null); setQuiz([]); setQuizAns({}); setChat([]); setAiError('')
    const fd = new FormData(); fd.append('file', f)
    try {
      const res = await fetch('/api/quick/extract', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'PDF işlenemedi'); setFile(null); return }
      setText(data.text)
    } catch { setError('Bir hata oluştu'); setFile(null) }
    finally { setExtracting(false) }
  }

  async function runAI(action: string, extra: any = {}) {
    setLoading(true); setAiError('')
    try {
      const res = await fetch('/api/quick/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error || 'AI hatası'); return null }
      return data
    } catch { setAiError('Bir hata oluştu'); return null }
    finally { setLoading(false) }
  }

  async function doSummary() { const d = await runAI('summary'); if (d) setSummary(d) }
  async function doQuiz() { setQuizAns({}); const d = await runAI('quiz'); if (d) setQuiz(d.questions || []) }
  async function sendChat() {
    if (!chatInput.trim() || loading) return
    const q = chatInput.trim(); setChatInput('')
    const next = [...chat, { role: 'user' as const, content: q }]
    setChat(next)
    const d = await runAI('chat', { question: q, messages: chat })
    setChat([...next, { role: 'assistant', content: d ? d.answer : (aiError || 'Hata') }])
  }

  if (session === null) return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🔐</p>
        <p className="font-semibold text-gray-900 dark:text-white mb-2">Giriş yap, PDF&apos;ini AI ile çalış</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Ücretsiz üye ol, kendi notunu saniyede özetle</p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login" className="btn-secondary">Giriş Yap</Link>
          <Link href="/auth/register" className="btn-primary">Üye Ol</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">PDF&apos;ini at, AI ile çalış</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Kendi notunu yükle — saniyede özet, quiz ve asistan. Paylaşmana gerek yok.</p>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        {!text ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false) }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
              dragging ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/40' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
            }`}>
            {extracting ? (
              <>
                <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 mt-3">PDF okunuyor...</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-2">📄</p>
                <p className="font-medium text-gray-700 dark:text-gray-300">PDF seç veya sürükle bırak</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ders notun, kitap sayfan, herhangi bir PDF</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">📄</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{file?.name || 'PDF'}</span>
              </div>
              <button onClick={() => { setText(''); setFile(null); setSummary(null); setQuiz([]); setChat([]) }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">Değiştir</button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { k: 'summary', l: '🧠 Özet' },
                { k: 'quiz', l: '❓ Quiz' },
                { k: 'chat', l: '💬 Asistan' },
              ].map(t => (
                <button key={t.k} onClick={() => { setTab(t.k as any); setAiError(''); if (t.k === 'summary' && !summary) doSummary(); if (t.k === 'quiz' && quiz.length === 0) doQuiz() }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${tab === t.k ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t.l}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {aiError && <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">{aiError}</div>}

              {tab === 'summary' && (
                loading && !summary ? <Spinner label="AI özetliyor..." /> :
                summary ? (
                  <div className="space-y-5">
                    <div><h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Özet</h3><p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{summary.summary}</p></div>
                    {summary.keyTopics?.length > 0 && <div><h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Temel Konular</h3><div className="flex flex-wrap gap-2">{summary.keyTopics.map((t: string) => <span key={t} className="badge bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{t}</span>)}</div></div>}
                    {summary.likelySyllabus?.length > 0 && <div><h3 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">⚠️ Sınavda Çıkabilecekler</h3><ul className="space-y-1.5">{summary.likelySyllabus.map((t: string) => <li key={t} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><span className="text-orange-400">→</span> {t}</li>)}</ul></div>}
                  </div>
                ) : <button onClick={doSummary} className="btn-primary">Özet Oluştur</button>
              )}

              {tab === 'quiz' && (
                loading && quiz.length === 0 ? <Spinner label="Sorular hazırlanıyor..." /> :
                quiz.length > 0 ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center"><p className="font-medium text-gray-900 dark:text-white">{quiz.length} Soru</p><button onClick={doQuiz} className="text-sm text-blue-600 hover:underline">Yenile</button></div>
                    {quiz.map((q, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <p className="font-medium mb-3 text-gray-900 dark:text-white text-sm">{i + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, j) => {
                            const answered = j === quizAns[i], correct = j === q.correct, show = quizAns[i] !== undefined
                            return <button key={j} onClick={() => setQuizAns({ ...quizAns, [i]: j })} disabled={quizAns[i] !== undefined}
                              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${show ? (correct ? 'bg-green-50 dark:bg-green-950/50 border-green-400 text-green-700 dark:text-green-300' : answered ? 'bg-red-50 dark:bg-red-950/50 border-red-400 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-400') : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-gray-200'}`}>{opt}</button>
                          })}
                        </div>
                        {quizAns[i] !== undefined && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{q.explanation}</p>}
                      </div>
                    ))}
                  </div>
                ) : <button onClick={doQuiz} className="btn-primary">Quiz Oluştur</button>
              )}

              {tab === 'chat' && (
                <div>
                  <div className="h-72 overflow-y-auto space-y-3 mb-4 pr-1">
                    {chat.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">Bu PDF&apos;e dair soru sor. AI sadece bu notun içeriğine göre cevap verir.</p>}
                    {chat.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>{m.content}</div></div>)}
                    {loading && <div className="flex justify-start"><div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div></div></div>}
                  </div>
                  <div className="flex gap-2">
                    <input className="input flex-1 text-sm" placeholder="Soru sor..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
                    <button onClick={sendChat} disabled={loading || !chatInput.trim()} className="btn-primary px-4">→</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Spinner({ label }: { label: string }) {
  return <div className="text-center py-10"><div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /><p className="text-gray-500 dark:text-gray-400 mt-3">{label}</p></div>
}
