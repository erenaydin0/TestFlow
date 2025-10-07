# CosmicQA - Playwright Test Automation Dashboard

Görsel test oluşturma ve Playwright ile otomatik test çalıştırma özelliklerine sahip modern bir test otomasyon platformudur.

## 🚀 Özellikler

- **Visual Test Builder** - Drag & drop ile test adımları oluşturma
- **Test Management** - Test workflow'larını kaydetme, düzenleme, silme
- **Playwright Integration** - Gerçek browser otomasyonu ile test çalıştırma
- **Real-time Execution** - WebSocket ile canlı test progress takibi
- **Screenshot Support** - Test adımlarında otomatik screenshot alma
- **Action Library** - Navigate, Click, Type, Wait, Verify, Scroll, Hover, Key actions
- **Scheduled Tests** - Cron expression ile zamanlanmış testler
- **Multi-Browser Support** - Chromium, Firefox, WebKit, Edge desteği

## 🛠️ Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd CosmicQA
```

### 2. Dependencies'leri Kurun
```bash
npm install
cd server
npm install
cd ..
```

### 3. Playwright'i Kurun
```bash
npx playwright install chromium
```

### 4. Environment Variables Ayarlayın
```bash
# .env.local dosyasını oluşturun
cp env.example .env.local

# Gerekli değişkenleri düzenleyin
# Varsayılan değerler development için uygundur
```

## 🚀 Çalıştırma

### Development Mode (Önerilen)
```bash
npm run dev:full
```

Bu komut şunları başlatır:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Ayrı Ayrı Çalıştırma

**Frontend:**
```bash
npm run dev
```

**Backend:**
```bash
npm run server
# veya development mode için
npm run server:dev
```

## 📁 Proje Yapısı

```
CosmicQA/
├── src/                      # Frontend (Next.js)
│   ├── app/                  # Next.js app router pages
│   ├── components/           # React components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utility functions & config
│   └── types/                # TypeScript type definitions
├── server/                   # Backend (Express + Playwright)
│   ├── config.js            # Server configuration
│   ├── index.js             # Express server
│   ├── testRunner.js        # Playwright test runner
│   ├── scriptGenerator.js   # Test script generator
│   ├── scheduler.js         # Test scheduler
│   ├── executions/          # Test execution results
│   ├── screenshots/         # Test screenshots
│   ├── videos/              # Test recordings
│   ├── tests/               # Saved test workflows
│   └── scheduled-tests/     # Scheduled test configs
└── public/                   # Static assets
```

## ⚙️ Environment Variables

Tüm environment variables için `env.example` dosyasına bakın.

### Önemli Değişkenler:

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (default: ws://localhost:3001)

**Backend:**
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DEFAULT_BROWSER` - Default browser (chromium/firefox/webkit/msedge)
- `DEFAULT_HEADLESS` - Headless mode (true/false)
- `ENABLE_DEBUG_LOGS` - Debug logging (true/false)

## 🧪 Test Builder Kullanımı

1. **Test Builder** sayfasına gidin
2. Sol panelden action'ları sürükleyip canvas'a bırakın
3. Her adımı tıklayarak detaylarını düzenleyin
4. Adımları birbirine bağlayarak flow oluşturun
5. **Save** ile testi kaydedin
6. **Run** ile testi çalıştırın

## 📊 Dashboard Özellikleri

- **Stats Cards** - Toplam test, başarı oranı, aktif zamanlamalar
- **Daily Results** - Günlük test sonuçları grafiği
- **Test Suite Distribution** - Test gruplarına göre dağılım
- **Recent Tests** - Son çalıştırılan testler
- **Upcoming Tests** - Yaklaşan zamanlanmış testler

## 🔧 API Endpoints

### Tests
- `GET /api/tests` - Tüm testleri listele
- `GET /api/tests/:id` - Test detayı
- `POST /api/tests` - Yeni test oluştur
- `PUT /api/tests/:id` - Test güncelle
- `DELETE /api/tests/:id` - Test sil

### Executions
- `POST /api/execute` - Test çalıştır
- `GET /api/executions` - Tüm execution'ları listele
- `GET /api/execution/:id` - Execution detayı
- `DELETE /api/executions/:id` - Execution sil

### Scheduled Tests
- `GET /api/scheduled-tests` - Zamanlanmış testleri listele
- `POST /api/scheduled-tests` - Zamanlama oluştur
- `PUT /api/scheduled-tests/:id` - Zamanlama güncelle
- `DELETE /api/scheduled-tests/:id` - Zamanlama sil

### Health
- `GET /api/health` - Server health check

## 🎨 Teknolojiler

**Frontend:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Recharts (grafikler)
- Lucide React (ikonlar)

**Backend:**
- Node.js
- Express
- Playwright
- WebSocket (ws)
- Croner (scheduler)

## 📝 Lisans

ISC

## 👥 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için lütfen önce bir issue açın.

## 🐛 Bilinen Sorunlar

- Edge browser desteği bazı sistemlerde çalışmayabilir
- Çok uzun test workflow'ları performans sorunlarına yol açabilir
- Video kayıtları büyük disk alanı kullanabilir

## 📞 Destek

Sorularınız için issue açabilirsiniz.