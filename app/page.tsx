import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getDb } from '@/lib/db'
import NoteCard from '@/components/NoteCard'

// Her ziyarette güncel sayıları göstermek için dinamik render
export const dynamic = 'force-dynamic'

async function getFeaturedData() {
  try {
    const db = getDb()
    const notes = db.prepare(`
      SELECT n.*, u.name as seller_name
      FROM notes n
      JOIN users u ON u.id = n.seller_id
      WHERE n.status = 'active'
      ORDER BY n.downloads DESC, n.created_at DESC
      LIMIT 6
    `).all() as any[]

    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM notes WHERE status = 'active') as note_count,
        (SELECT COUNT(DISTINCT university) FROM notes WHERE status = 'active') as school_count
    `).get() as any

    return { notes, stats }
  } catch {
    return { notes: [], stats: { user_count: 0, note_count: 0, school_count: 0 } }
  }
}

export default async function Home() {
  const { notes } = await getFeaturedData()

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Türkiye&apos;nin öğrenci not topluluğu
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Ders notlarını paylaş,<br />
              başkalarının notlarından öğren
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              WhatsApp gruplarında kaybolmadan, Telegram kanallarında aramadan.
              Üniversite ve lise notları tek yerde — tamamen ücretsiz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/browse" className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg">
                Not Bul
              </Link>
              <Link href="/auth/register" className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg">
                Not Paylaş
              </Link>
            </div>
          </div>
        </section>

        {/* Free banner */}
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-4 py-1.5 rounded-full font-semibold text-sm mb-4">
              ✓ Gizli ücret yok
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
              Tüm notlar, AI özet, quiz ve asistan{' '}
              <span className="text-blue-600 dark:text-blue-400">%100 ücretsiz</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
              Kredi kartı yok, abonelik yok, gizli ücret yok. Sadece kaydol ve kullan.
            </p>
          </div>
        </section>

        {/* Featured Notes */}
        {notes.length > 0 && (
          <section className="py-16 px-4 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Öne Çıkan Notlar</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">En çok indirilen ve beğenilen notlar</p>
                </div>
                <Link href="/browse" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  Tümünü Gör →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className={`py-20 px-4 ${notes.length > 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'}`}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3 text-gray-900 dark:text-white">Nasıl Çalışır?</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12">İki adımda başla</p>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="card p-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-5">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Not Bul</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  {[
                    'Okul, bölüm/sınıf ve dersi seç',
                    'Binlerce not arasından filtrele',
                    'Ücretsiz indir — hesap yeterli',
                    'AI ile özetle, quiz çöz, soru sor',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
                <Link href="/browse" className="btn-primary mt-6 w-full justify-center">Not Bul</Link>
              </div>

              <div className="card p-8">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-5">
                  <span className="text-2xl">📤</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Not Paylaş</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  {[
                    'Hesap oluştur',
                    'Kendi notunu PDF olarak yükle',
                    'Topluluğa katkı sağla',
                    'Puan ve yorum al',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="btn-primary mt-6 w-full justify-center">Not Paylaş</Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI Features */}
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="badge bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mb-3">Yapay Zeka</span>
              <h2 className="text-3xl font-bold mt-2 mb-3 text-gray-900 dark:text-white">AI ile Daha Akıllı Çalış</h2>
              <p className="text-gray-500 dark:text-gray-400">Her not için Claude AI destekli öğrenme araçları — ücretsiz</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🧠', title: 'Otomatik Özet', desc: '100 sayfalık PDF\'i saniyeler içinde özetle. Önemli konular ve sınav odakları otomatik işaretlenir.' },
                { icon: '❓', title: 'Quiz Oluşturma', desc: 'Notuna göre çoktan seçmeli sorular üretilir. Doğru cevap açıklamalarıyla anlayarak öğren.' },
                { icon: '💬', title: 'Kişisel Asistan', desc: '"Bu konuyu anlamadım" de — AI sadece o notun içeriğine göre seni adım adım açıklasın.' },
              ].map(f => (
                <div key={f.title} className="card p-6">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Types */}
        <section className="py-20 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3 text-gray-900 dark:text-white">Ne Paylaşılabilir?</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Kendi hazırladığın her türlü içerik</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '📝', label: 'Ders Notları', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
                { icon: '📋', label: 'Özetler', color: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800' },
                { icon: '📄', label: 'Çıkmış Sorular', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
                { icon: '✅', label: 'Çözümlü Sorular', color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
                { icon: '📊', label: 'Sunumlar', color: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800' },
                { icon: '🧪', label: 'Lab Raporları', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
              ].map(t => (
                <div key={t.label} className={`flex items-center gap-3 p-4 rounded-xl border ${t.color}`}>
                  <span className="text-2xl">{t.icon}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
              <strong>⚠️ Önemli:</strong> Yalnızca kendi hazırladığın içerikleri yükleyebilirsin. Ders kitabı PDF&apos;leri ve korsan kaynaklar kesinlikle yasaktır.
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 dark:bg-blue-700 text-white py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Topluluğa Katıl</h2>
            <p className="text-blue-100 mb-8">Ücretsiz üye ol. Not paylaş, indir, AI ile çalış.</p>
            <Link href="/auth/register" className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg">
              Ücretsiz Başla
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">NotMarket</span>
              <span>© 2025</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Gizlilik</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Kullanım Şartları</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">İletişim</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
