'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

interface User {
  id: string
  name: string
  email: string
  role?: string
  points?: number
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      // Geçersiz/eski oturumda ad boş olabilir — o durumda çıkış yapmış say
      .then((data) => setUser(data?.user?.name ? data.user : null))
      .catch(() => {})
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">NotMarket</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/calis" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              ✨ AI ile Çalış
            </Link>
            <Link href="/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
              Not Bul
            </Link>
            {user && (
              <>
                <Link href="/upload" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Not Paylaş
                </Link>
                <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
                  Hesabım
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-red-600 dark:text-red-400 hover:underline font-medium">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span title="Puanın — not yükleyerek kazan, AI'da harca"
                className="hidden sm:inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-sm font-medium px-2.5 py-1 rounded-full">
                ⭐ {user.points ?? 0}
              </span>
            )}
            {user && <NotificationBell />}
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block">{user.name.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <Link href={`/profil/${user.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMenuOpen(false)}>
                      Profilim
                    </Link>
                    <Link href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMenuOpen(false)}>
                      Hesabım
                    </Link>
                    <Link href="/upload"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMenuOpen(false)}>
                      Not Yükle
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin"
                        className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMenuOpen(false)}>
                        Admin Paneli
                      </Link>
                    )}
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary text-sm py-2">
                  Giriş
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2">
                  Üye Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
