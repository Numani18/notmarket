'use client'

import { useEffect } from 'react'

// Önceden kaydedilmiş service worker'ları temizler.
// (Eski SW production'da CSS yüklenmesini bozuyordu; PWA/TWA için SW şart değil.)
export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      }).catch(() => {})
      if (window.caches) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
      }
    }
  }, [])
  return null
}
