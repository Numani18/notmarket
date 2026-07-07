# NotMarket 📚

Türkiye'nin öğrenci not platformu. Ders notlarını sat, ihtiyacın olanı al, AI ile daha akıllı çalış.

## Kurulum

### 1. Node.js Kur (yoksa)
https://nodejs.org adresinden LTS sürümünü indir ve kur.

### 2. Bağımlılıkları Yükle
```bash
cd notmarket
npm install
```

### 3. Ortam Değişkenlerini Ayarla
`.env.local` dosyasını aç ve düzenle:
```
ANTHROPIC_API_KEY=sk-ant-...   # https://console.anthropic.com adresinden al
JWT_SECRET=rastgele-uzun-bir-string
```

### 4. Çalıştır
```bash
npm run dev
```

Tarayıcıda http://localhost:3000 adresine git.

## Özellikler

- **Not Satışı** — PDF yükle, fiyat belirle, %85 kazan
- **Not Arama** — Üniversite, bölüm, ders, tür bazında filtrele
- **AI Özet** — Claude AI ile otomatik özet + sınav odakları
- **Quiz** — Nottan otomatik çoktan seçmeli sorular
- **Asistan** — Nota özgü soru-cevap chatbotu
- **Dashboard** — Aldığın ve sattığın notlar, kazanç takibi

## Teknoloji

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- SQLite (better-sqlite3) — sıfır kurulum veritabanı
- Claude API (Anthropic) — AI özetleme, quiz, sohbet
- JWT — kimlik doğrulama

## Klasör Yapısı

```
app/
  page.tsx           — Landing page
  browse/            — Not arama
  upload/            — Not yükleme
  note/[id]/         — Not detayı + AI özellikleri
  dashboard/         — Kullanıcı paneli
  auth/              — Giriş / üye ol
  api/               — Backend API routes
lib/
  db.ts              — SQLite veritabanı
  auth.ts            — JWT kimlik doğrulama
  claude.ts          — Anthropic AI entegrasyonu
components/
  Navbar.tsx
  NoteCard.tsx
```
