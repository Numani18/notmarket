'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const NOTE_TYPE_LABELS: Record<string, string> = {
  notes: 'Ders Notu',
  summary: 'Özet',
  past_exams: 'Çıkmış Soru',
  solved: 'Çözümlü Soru',
  presentation: 'Sunum',
  lab: 'Lab Raporu',
}

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }
interface Review { id: string; user_name: string; rating: number; comment: string; created_at: string }

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={readonly}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'} ${
            s <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}>★</button>
      ))}
    </div>
  )
}

export default function NotePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'preview' | 'summary' | 'quiz' | 'chat' | 'reviews'>('info')

  const [summary, setSummary] = useState<any>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [reviews, setReviews] = useState<Review[]>([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [similarNotes, setSimilarNotes] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/notes/${id}`).then(r => r.json()).then(d => {
      setNote(d.note)
      setLoading(false)
      if (d.note) {
        fetch(`/api/notes?course=${encodeURIComponent(d.note.course)}&school_type=${d.note.school_type || 'universite'}`)
          .then(r => r.json())
          .then(data => setSimilarNotes((data.notes || []).filter((n: any) => n.id !== id).slice(0, 3)))
      }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setSession(d.user)
      if (d.user) {
        fetch(`/api/favorites?noteId=${id}`).then(r => r.json()).then(data => setSaved(data.saved))
      }
    })
    loadReviews()
  }, [id])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  async function loadReviews() {
    const res = await fetch(`/api/reviews?noteId=${id}`)
    const data = await res.json()
    setReviews(data.reviews || [])
  }

  async function loadSummary() {
    setSummaryLoading(true)
    const res = await fetch(`/api/ai/summarize?noteId=${id}`)
    setSummary(await res.json())
    setSummaryLoading(false)
  }

  async function loadQuiz() {
    setQuizLoading(true)
    setQuizAnswers({})
    const res = await fetch(`/api/ai/quiz?noteId=${id}`)
    const data = await res.json()
    setQuiz(data.questions || [])
    setQuizLoading(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const newMessages: ChatMsg[] = [...chatMessages, { role: 'user', content: msg }]
    setChatMessages(newMessages)
    setChatLoading(true)
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id, messages: chatMessages, question: msg }),
    })
    const data = await res.json()
    setChatMessages([...newMessages, { role: 'assistant', content: data.answer }])
    setChatLoading(false)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!myRating) return
    setReviewSubmitting(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id, rating: myRating, comment: myComment }),
    })
    setReviewSuccess(true)
    setMyRating(0)
    setMyComment('')
    await loadReviews()
    const data = await fetch(`/api/notes/${id}`).then(r => r.json())
    setNote(data.note)
    setReviewSubmitting(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Bugün'
    if (days === 1) return 'Dün'
    if (days < 30) return `${days} gün önce`
    if (days < 365) return `${Math.floor(days / 30)} ay önce`
    return `${Math.floor(days / 365)} yıl önce`
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      </div>
    </>
  )

  if (!note) return (
    <>
      <Navbar />
      <div className="text-center py-20">
        <p className="text-gray-500">Not bulunamadı</p>
        <Link href="/browse" className="text-blue-600 mt-2 inline-block">Geri Dön</Link>
      </div>
    </>
  )

  async function toggleSave() {
    if (!session) return router.push('/auth/login')
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id }),
    })
    const data = await res.json()
    setSaved(data.saved)
  }

  const tabs = [
    { key: 'info', label: '📄 İndir' },
    { key: 'preview', label: '👁 Önizle' },
    { key: 'summary', label: '🧠 AI Özet' },
    { key: 'quiz', label: '❓ Quiz' },
    { key: 'chat', label: '💬 Asistan' },
    { key: 'reviews', label: `⭐ Yorumlar${reviews.length > 0 ? ` (${reviews.length})` : ''}` },
  ]

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-5 flex-wrap">
          <Link href="/browse" className="hover:text-gray-700 dark:hover:text-gray-200">Not Bul</Link>
          <span>/</span>
          <span>{note.department}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">{note.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {/* Info card */}
            <div className="card p-5 sm:p-7 mb-4">
              <div className="flex items-start gap-3 mb-3 flex-wrap">
                <span className="badge bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {NOTE_TYPE_LABELS[note.type] || note.type}
                </span>
                {note.rating && note.rating_count > 0 && (
                  <span className="flex items-center gap-1 text-sm text-yellow-500 font-medium">
                    ★ {note.rating.toFixed(1)}
                    <span className="text-gray-400 font-normal">({note.rating_count})</span>
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{note.title}</h1>
                <button
                  onClick={toggleSave}
                  className={`shrink-0 p-2 rounded-lg border transition-colors ${
                    saved
                      ? 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-700 text-yellow-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-yellow-500 hover:border-yellow-300'
                  }`}
                  title={saved ? 'Kaydedildi' : 'Kaydet'}
                >
                  {saved ? '★' : '☆'}
                </button>
              </div>
              {note.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm leading-relaxed">{note.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'Üniversite', value: note.university },
                  { label: 'Bölüm', value: note.department },
                  { label: 'Ders', value: note.course },
                  note.instructor && { label: 'Hoca', value: note.instructor },
                  note.faculty && { label: 'Fakülte', value: note.faculty },
                  { label: 'Paylaşan', value: note.seller_name },
                  { label: 'İndirme', value: `${note.downloads} kez` },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label}>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">{item.label}</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="card overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {tabs.map((tab) => (
                  <button key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key as any)
                      if (tab.key === 'summary' && !summary) loadSummary()
                      if (tab.key === 'quiz' && quiz.length === 0) loadQuiz()
                    }}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                {/* İndir */}
                {activeTab === 'info' && (
                  <div className="text-center py-8">
                    {session ? (
                      <>
                        <p className="text-4xl mb-3">📄</p>
                        <p className="font-semibold text-gray-900 dark:text-white mb-4">Bu not ücretsiz</p>
                        <a href={`/api/notes/${id}/download`} className="btn-primary inline-flex">
                          📥 PDF İndir
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl mb-3">🔐</p>
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">İndirmek için giriş yap</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ücretsiz üye ol, tüm notlara eriş</p>
                        <div className="flex gap-3 justify-center">
                          <Link href="/auth/login" className="btn-secondary">Giriş Yap</Link>
                          <Link href="/auth/register" className="btn-primary">Üye Ol</Link>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Önizle */}
                {activeTab === 'preview' && (
                  session ? (
                    <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <iframe
                        src={`${note.file_path}#toolbar=0`}
                        className="w-full h-full"
                        title={note.title}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-3">👁</p>
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Önizleme için giriş yap</p>
                      <div className="flex gap-3 justify-center">
                        <Link href="/auth/login" className="btn-secondary">Giriş Yap</Link>
                        <Link href="/auth/register" className="btn-primary">Üye Ol</Link>
                      </div>
                    </div>
                  )
                )}

                {/* AI Özet */}
                {activeTab === 'summary' && (
                  !session ? (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-3">🧠</p>
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">AI özetleme için giriş yap</p>
                      <Link href="/auth/register" className="btn-primary mt-2 inline-flex">Üye Ol — Ücretsiz</Link>
                    </div>
                  ) : summaryLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-gray-500 dark:text-gray-400 mt-3">AI analiz ediyor...</p>
                    </div>
                  ) : summary ? (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Özet</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{summary.summary}</p>
                      </div>
                      {summary.keyTopics?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Temel Konular</h3>
                          <div className="flex flex-wrap gap-2">
                            {summary.keyTopics.map((t: string) => (
                              <span key={t} className="badge bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {summary.likelySyllabus?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">⚠️ Sınavda Çıkabilecekler</h3>
                          <ul className="space-y-1.5">
                            {summary.likelySyllabus.map((t: string) => (
                              <li key={t} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-orange-400">→</span> {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={loadSummary} className="btn-primary">AI Özet Oluştur</button>
                  )
                )}

                {/* Quiz */}
                {activeTab === 'quiz' && (
                  !session ? (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-3">❓</p>
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Quiz için giriş yap</p>
                      <Link href="/auth/register" className="btn-primary mt-2 inline-flex">Üye Ol — Ücretsiz</Link>
                    </div>
                  ) : quizLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-gray-500 dark:text-gray-400 mt-3">Sorular hazırlanıyor...</p>
                    </div>
                  ) : quiz.length > 0 ? (
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900 dark:text-white">{quiz.length} Soru</p>
                        <button onClick={loadQuiz} className="text-sm text-blue-600 hover:underline">Yenile</button>
                      </div>
                      {quiz.map((q, i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                          <p className="font-medium mb-3 text-gray-900 dark:text-white text-sm">{i + 1}. {q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, j) => {
                              const answered = j === quizAnswers[i]
                              const isCorrect = j === q.correct
                              const showResult = quizAnswers[i] !== undefined
                              return (
                                <button key={j}
                                  onClick={() => setQuizAnswers({ ...quizAnswers, [i]: j })}
                                  disabled={quizAnswers[i] !== undefined}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                                    showResult
                                      ? isCorrect ? 'bg-green-50 dark:bg-green-950/50 border-green-400 text-green-700 dark:text-green-300'
                                        : answered ? 'bg-red-50 dark:bg-red-950/50 border-red-400 text-red-700 dark:text-red-300'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-400'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-700 dark:text-gray-200'
                                  }`}>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                          {quizAnswers[i] !== undefined && (
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{q.explanation}</p>
                          )}
                        </div>
                      ))}
                      {Object.keys(quizAnswers).length === quiz.length && (
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
                          <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                            Sonuç: {Object.entries(quizAnswers).filter(([i, a]) => a === quiz[+i].correct).length}/{quiz.length}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={loadQuiz} className="btn-primary">Quiz Oluştur</button>
                  )
                )}

                {/* Chat */}
                {activeTab === 'chat' && (
                  !session ? (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-3">💬</p>
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Asistan için giriş yap</p>
                      <Link href="/auth/register" className="btn-primary mt-2 inline-flex">Üye Ol — Ücretsiz</Link>
                    </div>
                  ) : (
                    <div>
                      <div className="h-72 overflow-y-auto space-y-3 mb-4 pr-1">
                        {chatMessages.length === 0 && (
                          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
                            Bu nota dair sorularını sor. AI yalnızca notun içeriğine göre cevap verir.
                          </p>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                            }`}>{msg.content}</div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                              <div className="flex gap-1">
                                {[0,1,2].map(i => (
                                  <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="flex gap-2">
                        <input className="input flex-1 text-sm" placeholder="Soru sor..."
                          value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendChat()} />
                        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="btn-primary px-4">→</button>
                      </div>
                    </div>
                  )
                )}

                {/* Yorumlar */}
                {activeTab === 'reviews' && (
                  <div className="space-y-5">
                    {session && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm">Yorumunu Bırak</h3>
                        {reviewSuccess ? (
                          <p className="text-green-600 dark:text-green-400 text-sm">✓ Yorumun kaydedildi!</p>
                        ) : (
                          <form onSubmit={submitReview} className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Puanın</p>
                              <StarRating value={myRating} onChange={setMyRating} />
                            </div>
                            <textarea className="input resize-none text-sm" rows={3}
                              placeholder="Bu not hakkında ne düşünüyorsun? (opsiyonel)"
                              value={myComment} onChange={e => setMyComment(e.target.value)} />
                            <button type="submit" disabled={!myRating || reviewSubmitting} className="btn-primary text-sm py-2">
                              {reviewSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                    {reviews.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                        <p className="text-3xl mb-2">💬</p>
                        <p className="text-sm">Henüz yorum yok — ilk sen bırak!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {note.rating && note.rating_count > 0 && (
                          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl">
                            <p className="text-4xl font-bold text-yellow-500">{note.rating.toFixed(1)}</p>
                            <div>
                              <StarRating value={Math.round(note.rating)} readonly />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.rating_count} değerlendirme</p>
                            </div>
                          </div>
                        )}
                        {reviews.map(r => (
                          <div key={r.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{r.user_name}</p>
                                <StarRating value={r.rating} readonly />
                              </div>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(r.created_at)}</span>
                            </div>
                            {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            <div className="card p-5 lg:sticky lg:top-20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">Ücretsiz</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Giriş yaparak indirebilirsin</p>

              {session ? (
                <div className="space-y-2">
                  <a href={`/api/notes/${id}/download`} className="btn-primary w-full justify-center">
                    📥 PDF İndir
                  </a>
                  <button onClick={toggleSave} className={`w-full justify-center btn-secondary text-sm py-2 ${saved ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                    {saved ? '★ Kaydedildi' : '☆ Kaydet'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/register" className="btn-primary w-full justify-center">Üye Ol — Ücretsiz</Link>
                  <Link href="/auth/login" className="btn-secondary w-full justify-center">Giriş Yap</Link>
                </div>
              )}

              <hr className="my-4 border-gray-200 dark:border-gray-700" />
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2"><span>👁</span> Önizle</li>
                <li className="flex items-center gap-2"><span>📥</span> Ücretsiz indir</li>
                <li className="flex items-center gap-2"><span>🧠</span> AI ile özetle</li>
                <li className="flex items-center gap-2"><span>❓</span> Quiz çöz</li>
                <li className="flex items-center gap-2"><span>💬</span> Asistana sor</li>
                <li className="flex items-center gap-2"><span>⭐</span> Yorum bırak</li>
              </ul>
            </div>

            {similarNotes.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Benzer Notlar</h3>
                <div className="space-y-3">
                  {similarNotes.map(n => (
                    <Link key={n.id} href={`/note/${n.id}`} className="block group">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors">{n.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{n.course} · {n.downloads} ↓</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
