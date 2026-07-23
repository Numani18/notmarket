import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import ServiceWorker from '@/components/ServiceWorker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NotMarket — Yapay Zeka Destekli Çalışma Asistanı',
  description: 'Ders notunu yükle, yapay zeka saniyede özetlesin, quiz çıkarsın ve anlamadığın yeri açıklasın. Binlerce hazır not — tamamen ücretsiz.',
  manifest: '/manifest.webmanifest',
  applicationName: 'NotMarket',
  appleWebApp: {
    capable: true,
    title: 'NotMarket',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
