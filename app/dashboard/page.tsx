'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import NoteCard from '@/components/NoteCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EditForm { title: string; description: string; course: string; instructor: string }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [myNotes, setMyNotes] = useState<any[]>([])
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [tab, setTab] = useState<'my' | 'saved'>('my')
  const [loading, setLoading] = useState(true)

  const [editNote, setEditNote] = useState<any>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', description: '', course: '', instructor: '' })
  const [editLoading, setEditLoading] = useState(false)

  const [deleteNote, setDeleteNote] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/favorites').then(r => r.json()),
    ]).then(([meData, dashData, favData]) => {
      if (!meData.user) { router.push('/auth/login'); return }
      setUser(meData.user)
      setMyNotes(dashData.myNotes || [])
      setSavedNotes(favData.notes || [])
      setLoading(false)
    })
  }, [router])

  function openEdit(note: any) {
    setEditNote(note)
    setEditForm({ title: note.title, description: note.description || '', course: note.course, instructor: note.instructor || '' })
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editNote) return
    setEditLoading(true)
    await fetch(`/api/notes/${editNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setMyNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, ...editForm } : n))
    setEditNote(null)
    setEditLoading(false)
  }

  async function confirmDelete() {
    if (!deleteNote) return
    setDeleteLoading(true)
    await fetch(`/api/notes/${deleteNote.id}`, { method: 'DELETE' })
    setMyNotes(prev => prev.filter(n => n.id !== deleteNote.id))
    setDeleteNote(null)
    setDeleteLoading(false)
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </>
  )

  const totalDownloads = myNotes.reduce((s: number, n: any) => s + n.downloads, 0)
  const avgRating = myNotes.filter(n => n.rating).length > 0
    ? (myNotes.filter(n => n.rating).reduce((s, n) => s + n.rating, 0) / myNotes.filter(n => n.rating).length).toFixed(1)
    : null

  return (
    <>
      <Navbar />

      {/* Edit Modal */}
      {editNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditNote(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Notu Düzenle</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık</label>
                <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                <textarea className="input resize-none" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ders</label>
                <input className="input" value={editForm.course} onChange={e => setEditForm({ ...editForm, course: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öğretim Görevlisi</label>
                <input className="input" value={editForm.instructor} onChange={e => setEditForm({ ...editForm, instructor: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditNote(null)} className="btn-secondary flex-1 justify-center">İptal</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1 justify-center">
                  {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteNote(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-4xl mb-4">🗑️</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Notu Sil</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="font-medium text-gray-800 dark:text-gray-200">{deleteNote.title}</span> adlı not kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteNote(null)} className="btn-secondary flex-1 justify-center">İptal</button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 justify-center inline-flex items-center px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merhaba, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <Link href="/upload" className="btn-primary">+ Not Paylaş</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Paylaştığın Not', value: myNotes.length, icon: '📤' },
            { label: 'Toplam İndirme', value: totalDownloads, icon: '📥' },
            { label: 'Ortalama Puan', value: avgRating ? `${avgRating} ★` : '—', icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setTab('my')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              tab === 'my' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 dark:text-gray-400'
            }`}>
            Paylaştıklarım ({myNotes.length})
          </button>
          <button onClick={() => setTab('saved')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              tab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-gray-500 dark:text-gray-400'
            }`}>
            ★ Kaydettiklerim ({savedNotes.length})
          </button>
        </div>

        {tab === 'my' && (
          myNotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">📂</p>
              <p className="font-medium">Henüz not paylaşmadın</p>
              <Link href="/upload" className="btn-primary mt-4 inline-flex">İlk Notunu Paylaş</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myNotes.map(n => (
                <div key={n.id} className="relative group">
                  <NoteCard note={n} />
                  <div className="absolute top-3 right-3 hidden group-hover:flex gap-1.5">
                    <button
                      onClick={(e) => { e.preventDefault(); openEdit(n) }}
                      className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 shadow-sm text-sm"
                      title="Düzenle"
                    >✏️</button>
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteNote(n) }}
                      className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-600 shadow-sm text-sm"
                      title="Sil"
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'saved' && (
          savedNotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">★</p>
              <p className="font-medium">Henüz not kaydetmedin</p>
              <Link href="/browse" className="btn-primary mt-4 inline-flex">Not Bul</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedNotes.map(n => <NoteCard key={n.id} note={n} />)}
            </div>
          )
        )}
      </div>
    </>
  )
}
