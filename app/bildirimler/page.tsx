'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ICONS: Record<string, string> = {
  review: '⭐', download: '📥', report: '🚩', system: '🔔',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/auth/login'); return }
      fetch('/api/notifications').then(r => r.json()).then(data => {
        setNotifs(data.notifications || [])
        setLoading(false)
        // Sayfa açılınca tümünü okundu işaretle
        if (data.unread > 0) fetch('/api/notifications', { method: 'POST' })
      })
    })
  }, [router])

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'şimdi'
    if (mins < 60) return `${mins} dk önce`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} sa önce`
    return `${Math.floor(hrs / 24)} gün önce`
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bildirimler</h1>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">🔔</p>
            <p className="font-medium">Henüz bildirim yok</p>
            <p className="text-sm mt-1">Notların yorum veya indirme aldıkça burada görünür</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => {
              const inner = (
                <div className="card p-4 flex gap-3 items-start hover:shadow-md transition-shadow">
                  <span className="text-xl shrink-0">{ICONS[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              )
              return n.link
                ? <Link key={n.id} href={n.link}>{inner}</Link>
                : <div key={n.id}>{inner}</div>
            })}
          </div>
        )}
      </div>
    </>
  )
}
