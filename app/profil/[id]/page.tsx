'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NoteCard from '@/components/NoteCard'
import Link from 'next/link'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isOwn, setIsOwn] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', university: '', department: '' })
  const [editSaving, setEditSaving] = useState(false)

  function loadProfile() {
    fetch(`/api/profile/${id}`).then(r => {
      if (!r.ok) { setNotFound(true); setLoading(false); return null }
      return r.json()
    }).then(d => { if (d) setData(d); setLoading(false) })
  }

  useEffect(() => {
    loadProfile()
    fetch('/api/auth/me').then(r => r.json()).then(d => setIsOwn(d.user?.id === id))
  }, [id])

  function openEdit() {
    setEditForm({ name: data.user.name, university: data.user.university || '', department: data.user.department || '' })
    setEditOpen(true)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditSaving(true)
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditOpen(false)
    setEditSaving(false)
    loadProfile()
  }

  if (loading) return (
    <><Navbar /><div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
      <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div></>
  )

  if (notFound || !data) return (
    <><Navbar /><div className="text-center py-20">
      <p className="text-4xl mb-3">👤</p>
      <p className="text-gray-500">Kullanıcı bulunamadı</p>
      <Link href="/browse" className="text-blue-600 mt-2 inline-block">Not Bul</Link>
    </div></>
  )

  const { user, notes, stats } = data
  const joined = new Date(user.created_at + 'Z').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })

  return (
    <>
      <Navbar />

      {/* Profil düzenleme modalı */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Profili Düzenle</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Okul / Üniversite</label>
                <input className="input" placeholder="İTÜ, Kadıköy Anadolu Lisesi..." value={editForm.university} onChange={e => setEditForm({ ...editForm, university: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bölüm / Sınıf</label>
                <input className="input" placeholder="Bilgisayar Müh., 11. Sınıf..." value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1 justify-center">İptal</button>
                <button type="submit" disabled={editSaving} className="btn-primary flex-1 justify-center">{editSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profil başlığı */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-600 dark:text-blue-300 font-bold text-2xl">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              {(user.university || user.department) && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {[user.university, user.department].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{joined} tarihinde katıldı</p>
            </div>
            {isOwn && (
              <button onClick={openEdit} className="btn-secondary text-sm py-2 shrink-0">Düzenle</button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.noteCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Paylaşılan Not</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalDownloads}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toplam İndirme</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ortalama Puan</p>
            </div>
          </div>
        </div>

        {/* Notlar */}
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Paylaştığı Notlar</h2>
        {notes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">📂</p>
            <p>Henüz not paylaşmamış</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n: any) => <NoteCard key={n.id} note={n} />)}
          </div>
        )}
      </div>
    </>
  )
}
