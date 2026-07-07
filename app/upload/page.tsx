'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = [
  'İstanbul Teknik Üniversitesi', 'Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi',
  'Hacettepe Üniversitesi', 'Ankara Üniversitesi', 'İstanbul Üniversitesi', 'Ege Üniversitesi',
  'Dokuz Eylül Üniversitesi', 'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Bilkent Üniversitesi',
  'Marmara Üniversitesi', 'Yıldız Teknik Üniversitesi', 'Gazi Üniversitesi', 'Diğer',
]

const HIGH_SCHOOL_GRADES = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf']

const NOTE_TYPES = [
  { value: 'notes', label: 'Ders Notu' },
  { value: 'summary', label: 'Özet' },
  { value: 'past_exams', label: 'Çıkmış Soru' },
  { value: 'solved', label: 'Çözümlü Soru' },
  { value: 'presentation', label: 'Sunum' },
  { value: 'lab', label: 'Lab Raporu' },
]

export default function UploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [schoolType, setSchoolType] = useState<'universite' | 'lise'>('universite')
  const [form, setForm] = useState({
    title: '', description: '', university: '', faculty: '',
    department: '', course: '', instructor: '', type: 'notes', school_grade: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Lütfen bir PDF dosyası seç'); return }
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('school_type', schoolType)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Yükleme başarısız'); return }
      setSuccess(true)
      setTimeout(() => router.push(`/note/${data.noteId}`), 1500)
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Not Paylaş</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kendi hazırladığın notları topluluğa sun</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-1">⚠️ Telif Hakkı Uyarısı</p>
          <p>Yalnızca kendi hazırladığın içerikleri yükleyebilirsin. Ders kitabı PDF&apos;leri ve korsan kaynaklar yasaktır.</p>
        </div>

        {success ? (
          <div className="card p-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">Not Paylaşıldı!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Notun topluluğa sunuldu. Yönlendiriliyorsun...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Okul tipi seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eğitim Kademesi</label>
              <div className="flex gap-3">
                {[
                  { value: 'universite', label: '🎓 Üniversite' },
                  { value: 'lise', label: '🏫 Lise' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSchoolType(opt.value as any)}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
                      schoolType === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dosya yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                PDF Dosyası <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false) }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation(); setDragging(false)
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped?.type === 'application/pdf') { setFile(dropped); setError('') }
                  else if (dropped) setError('Yalnızca PDF dosyası yükleyebilirsin')
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-500 bg-blue-100 dark:bg-blue-950/40' :
                  file ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' :
                  'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                }`}
              >
                {file ? (
                  <div>
                    <p className="text-2xl mb-2">📄</p>
                    <p className="font-medium text-blue-700 dark:text-blue-300">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📤</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">PDF Seç veya Sürükle Bırak</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Maksimum 50 MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Başlık <span className="text-red-500">*</span></label>
                <input className="input" placeholder={schoolType === 'lise' ? 'Matematik Türev Özeti' : 'Veri Yapıları Final Özeti'}
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Açıklama</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="Bu notun içeriğini, kapsamını kısaca anlat..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {schoolType === 'universite' ? (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Üniversite <span className="text-red-500">*</span></label>
                    <select className="input" value={form.university}
                      onChange={e => setForm({ ...form, university: e.target.value })} required>
                      <option value="">Seç...</option>
                      {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fakülte</label>
                    <input className="input" placeholder="Mühendislik Fakültesi"
                      value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bölüm <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="Bilgisayar Mühendisliği"
                      value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ders Adı <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="Veri Yapıları"
                      value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Öğretim Görevlisi</label>
                    <input className="input" placeholder="Prof. Dr. Ahmet Yılmaz"
                      value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Okul Adı <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="Kadıköy Anadolu Lisesi"
                      value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sınıf <span className="text-red-500">*</span></label>
                    <select className="input" value={form.school_grade}
                      onChange={e => setForm({ ...form, school_grade: e.target.value, department: e.target.value })} required>
                      <option value="">Seç...</option>
                      {HIGH_SCHOOL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ders Adı <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="Matematik, Fizik..."
                      value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Öğretmen</label>
                    <input className="input" placeholder="Mehmet Hoca"
                      value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">İçerik Türü <span className="text-red-500">*</span></label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center text-base py-3" disabled={loading}>
              {loading ? 'Yükleniyor...' : '📤 Notu Paylaş'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
