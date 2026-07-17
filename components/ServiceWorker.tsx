'use client'

import { useEffect } from 'react'

// Service worker'ı kaydeder (PWA kurulabilirliği için)
export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
