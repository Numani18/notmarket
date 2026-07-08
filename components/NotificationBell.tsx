'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notif {
  id: string
  type: string
  message: string
  link: string | null
  is_read: number
  created_at: string
}

const ICONS: Record<string, string> = {
  review: '⭐', download: '📥', report: '🚩', system: '🔔',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {}
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // 30 sn'de bir yenile
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      await fetch('/api/notifications', { method: 'POST' })
      setUnread(0)
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
    }
  }

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
    <div className="relative" ref={ref}>
      <button onClick={toggle}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Bildirimler</p>
            <Link href="/bildirimler" onClick={() => setOpen(false)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Tümünü gör
            </Link>
          </div>
          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              <p className="text-2xl mb-2">🔔</p>
              Henüz bildirim yok
            </div>
          ) : (
            notifs.map(n => {
              const inner = (
                <div className={`px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${n.is_read ? '' : 'bg-blue-50/50 dark:bg-blue-950/20'}`}>
                  <span className="text-lg shrink-0">{ICONS[n.type] || '🔔'}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              )
              return n.link
                ? <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{inner}</Link>
                : <div key={n.id}>{inner}</div>
            })
          )}
        </div>
      )}
    </div>
  )
}
