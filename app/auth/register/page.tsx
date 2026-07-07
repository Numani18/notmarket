'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const UNIVERSITIES = [
  'İstanbul Teknik Üniversitesi',
  'Boğaziçi Üniversitesi',
  'Orta Doğu Teknik Üniversitesi',
  'Hacettepe Üniversitesi',
  'Ankara Üniversitesi',
  'İstanbul Üniversitesi',
  'Ege Üniversitesi',
  'Dokuz Eylül Üniversitesi',
  'Koç Üniversitesi',
  'Sabancı Üniversitesi',
  'Bilkent Üniversitesi',
  'Marmara Üniversitesi',
  'Yıldız Teknik Üniversitesi',
  'Gazi Üniversitesi',
  'Diğer',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    department: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="font-bold text-2xl">NotMarket</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Üye Ol</h1>
          <p className="text-gray-500 mt-1">Ücretsiz hesap oluştur</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
              <input
                type="text"
                className="input"
                placeholder="Ali Yılmaz"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <input
                type="email"
                className="input"
                placeholder="ornek@universite.edu.tr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <input
                type="password"
                className="input"
                placeholder="En az 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Üniversite <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <select
                className="input"
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
              >
                <option value="">Seç...</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bölüm <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Bilgisayar Mühendisliği"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Hesap oluşturuluyor...' : 'Üye Ol'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Üye olarak{' '}
              <a href="#" className="underline">Kullanım Şartları</a>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Zaten hesabın var mı?{' '}
          <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
