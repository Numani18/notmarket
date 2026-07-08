'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const REASON_LABELS: Record<string, string> = {
  telif: 'Telif ihlali', kalitesiz: 'Kalitesiz', yanlis_kategori: 'Yanlış kategori',
  spam: 'Spam', diger: 'Diğer',
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'reports' | 'notes'>('reports')
  const [reports, setReports] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [noteFilter, setNoteFilter] = useState<'all' | 'reported' | 'hidden'>('reported')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.role === 'admin') { setAuthorized(true); loadReports(); loadNotes('reported') }
      else { setAuthorized(false) }
    })
  }, [])

  async function loadReports() {
    const res = await fetch('/api/admin/reports')
    if (res.ok) setReports((await res.json()).reports || [])
  }
  async function loadNotes(filter: string) {
    const res = await fetch(`/api/admin/notes?filter=${filter}`)
    if (res.ok) setNotes((await res.json()).notes || [])
  }

  async function noteAction(noteId: string, action: string) {
    if (action === 'delete' && !confirm('Bu not kalıcı olarak silinsin mi?')) return
    await fetch('/api/admin/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, action }),
    })
    loadNotes(noteFilter)
    loadReports()
  }

  if (authorized === null) return (
    <><Navbar /><div className="max-w-5xl mx-auto px-4 py-10 text-gray-400">Yükleniyor...</div></>
  )
  if (!authorized) return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-semibold text-gray-900 dark:text-white">Bu sayfaya erişim yetkin yok</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">Ana Sayfa</Link>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🛡️ Admin Paneli</h1>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setTab('reports')}
            className={`px-5 py-3 text-sm font-medium ${tab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 dark:text-gray-400'}`}>
            Şikayetler ({reports.length})
          </button>
          <button onClick={() => setTab('notes')}
            className={`px-5 py-3 text-sm font-medium ${tab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 dark:text-gray-400'}`}>
            Notlar
          </button>
        </div>

        {tab === 'reports' && (
          reports.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">✅</p>
              <p>Bekleyen şikayet yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          {REASON_LABELS[r.reason] || r.reason}
                        </span>
                        {r.note_status === 'hidden' && (
                          <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">Gizli</span>
                        )}
                      </div>
                      <Link href={`/note/${r.note_id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600">
                        {r.note_title}
                      </Link>
                      {r.detail && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">&quot;{r.detail}&quot;</p>}
                      <p className="text-xs text-gray-400 mt-1">Şikayet eden: {r.reporter_name}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => noteAction(r.note_id, 'hide')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 hover:opacity-80">Gizle</button>
                      <button onClick={() => noteAction(r.note_id, 'show')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:opacity-80">Onayla</button>
                      <button onClick={() => noteAction(r.note_id, 'delete')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:opacity-80">Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'notes' && (
          <>
            <div className="flex gap-2 mb-4">
              {[
                { v: 'reported', l: 'Şikayetli' },
                { v: 'hidden', l: 'Gizli' },
                { v: 'all', l: 'Tümü' },
              ].map(f => (
                <button key={f.v} onClick={() => { setNoteFilter(f.v as any); loadNotes(f.v) }}
                  className={`text-sm px-3 py-1.5 rounded-lg ${noteFilter === f.v ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                  {f.l}
                </button>
              ))}
            </div>
            {notes.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Not yok</div>
            ) : (
              <div className="space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/note/${n.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate">{n.title}</Link>
                        {n.status === 'hidden' && <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500">Gizli</span>}
                        {n.report_count > 0 && <span className="badge bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">🚩 {n.report_count}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{n.seller_name} · {n.course} · {n.downloads} indirme</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {n.status === 'hidden'
                        ? <button onClick={() => noteAction(n.id, 'show')} className="text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Göster</button>
                        : <button onClick={() => noteAction(n.id, 'hide')} className="text-xs px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">Gizle</button>}
                      <button onClick={() => noteAction(n.id, 'delete')} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
