'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import NoteCard from '@/components/NoteCard'

const NOTE_TYPES = [
  { value: '', label: 'Tümü' },
  { value: 'notes', label: 'Ders Notu' },
  { value: 'summary', label: 'Özet' },
  { value: 'past_exams', label: 'Çıkmış Soru' },
  { value: 'solved', label: 'Çözümlü Soru' },
  { value: 'presentation', label: 'Sunum' },
  { value: 'lab', label: 'Lab Raporu' },
]

function FilterPanel({
  filters,
  setFilters,
}: {
  filters: any
  setFilters: (f: any) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Kademe</label>
        <div className="flex flex-col gap-1">
          {[{ value: '', label: 'Tümü' }, { value: 'universite', label: '🎓 Üniversite' }, { value: 'lise', label: '🏫 Lise' }, { value: 'ortaokul', label: '🎒 Ortaokul' }].map(opt => (
            <button key={opt.value} onClick={() => setFilters({ ...filters, school_type: opt.value })}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.school_type === opt.value
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>{opt.label}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {filters.school_type === 'universite' || filters.school_type === '' ? 'Üniversite' : 'Okul'}
        </label>
        <input className="input text-sm" placeholder={filters.school_type === 'universite' || filters.school_type === '' ? 'İTÜ, ODTÜ...' : 'Galatasaray Lisesi...'} value={filters.university}
          onChange={(e) => setFilters({ ...filters, university: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {filters.school_type === 'universite' || filters.school_type === '' ? 'Bölüm' : 'Sınıf'}
        </label>
        <input className="input text-sm" placeholder={filters.school_type === 'universite' || filters.school_type === '' ? 'Bilgisayar Müh...' : '7. Sınıf...'} value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ders</label>
        <input className="input text-sm" placeholder="Matematik, Fizik..." value={filters.course}
          onChange={(e) => setFilters({ ...filters, course: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">İçerik Türü</label>
        <div className="space-y-1">
          {NOTE_TYPES.map((t) => (
            <button key={t.value} onClick={() => setFilters({ ...filters, type: t.value })}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.type === t.value
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sırala</label>
        <select className="input text-sm" value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="newest">En Yeni</option>
          <option value="popular">En Çok İndirilen</option>
          <option value="rating">En Yüksek Puan</option>
        </select>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState({
    q: '', university: '', department: '', course: '', type: '', school_type: '', sort: 'newest',
  })

  const activeFilterCount = [filters.university, filters.department, filters.course, filters.type, filters.school_type]
    .filter(Boolean).length

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    const res = await fetch(`/api/notes?${params}`)
    const data = await res.json()
    setNotes(data.notes || [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300)
    return () => clearTimeout(timer)
  }, [fetchNotes])

  return (
    <>
      <Navbar />

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-gray-900 dark:text-white">Filtreler</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>
            <FilterPanel filters={filters} setFilters={(f) => { setFilters(f); }} />
            <button onClick={() => setDrawerOpen(false)} className="btn-primary w-full justify-center mt-6">
              Filtrele ({notes.length} sonuç)
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Not Bul</h1>

        {/* Search + mobile filter button */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <input type="text" className="input pl-10" placeholder="Ders adı, konu veya üniversite ara..."
              value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden btn-secondary flex items-center gap-2 px-4 relative"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtre
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 h-48 animate-pulse bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium">Not bulunamadı</p>
                <p className="text-sm mt-1">Farklı arama terimleri dene</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{notes.length} not bulundu</p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {notes.map((note) => <NoteCard key={note.id} note={note} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
