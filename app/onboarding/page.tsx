'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = [
  'İstanbul Teknik Üniversitesi', 'Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi',
  'Hacettepe Üniversitesi', 'Ankara Üniversitesi', 'İstanbul Üniversitesi', 'Ege Üniversitesi',
  'Dokuz Eylül Üniversitesi', 'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Bilkent Üniversitesi',
  'Marmara Üniversitesi', 'Yıldız Teknik Üniversitesi', 'Gazi Üniversitesi', 'Diğer',
]
const GRADES = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf']
const ORTAOKUL_GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf']

export default function OnboardingPage() {
  const router = useRouter()
  const [schoolType, setSchoolType] = useState<'universite' | 'lise' | 'ortaokul'>('universite')
  const [university, setUniversity] = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) router.push('/auth/login')
    })
  }, [router])

  async function save(skip = false) {
    setSaving(true)
    if (!skip) {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ university, department }),
      })
    }
    router.push('/browse')
  }

  return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">👋</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hoş geldin!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Okulunu seç, sana uygun notları öne çıkaralım. Sonra da değiştirebilirsin.
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eğitim Kademesi</label>
            <div className="flex gap-3">
              {[{ v: 'universite', l: '🎓 Üniversite' }, { v: 'lise', l: '🏫 Lise' }, { v: 'ortaokul', l: '🎒 Ortaokul' }].map(o => (
                <button key={o.v} type="button" onClick={() => { setSchoolType(o.v as any); setDepartment('') }}
                  className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
                    schoolType === o.v ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {schoolType === 'universite' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Üniversite</label>
                <select className="input" value={university} onChange={e => setUniversity(e.target.value)}>
                  <option value="">Seç...</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bölüm</label>
                <input className="input" placeholder="Bilgisayar Mühendisliği"
                  value={department} onChange={e => setDepartment(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Okul Adı</label>
                <input className="input" placeholder="Kadıköy Anadolu Lisesi"
                  value={university} onChange={e => setUniversity(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sınıf</label>
                <select className="input" value={department} onChange={e => setDepartment(e.target.value)}>
                  <option value="">Seç...</option>
                  {(schoolType === 'ortaokul' ? ORTAOKUL_GRADES : GRADES).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => save(true)} disabled={saving}
              className="btn-secondary flex-1 justify-center">Atla</button>
            <button onClick={() => save(false)} disabled={saving}
              className="btn-primary flex-1 justify-center">{saving ? 'Kaydediliyor...' : 'Devam Et'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
