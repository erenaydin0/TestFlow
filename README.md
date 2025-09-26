# CosmicQA - Playwright Test Automation Dashboard

CosmicQA, görsel test oluşturma ve Playwright ile otomatik test çalıştırma özelliklerine sahip modern bir test otomasyon platformudur.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler
- **Visual Test Builder** - Drag & drop ile test adımları oluşturma
- **Test Management** - Test workflow'larını kaydetme, düzenleme, silme
- **Import/Export** - Test workflow'larını JSON formatında içe/dışa aktarma
- **Playwright Integration** - Gerçek browser otomasyonu ile test çalıştırma
- **Real-time Execution** - WebSocket ile canlı test progress takibi
- **Screenshot Support** - Test adımlarında otomatik screenshot alma
- **Action Library** - Navigate, Click, Type, Wait, Verify, Scroll, Hover, Key actions

### 🔄 Test Actions
- **Navigate** - Web sayfalarına gitme
- **Click** - Element'lere tıklama
- **Type** - Text input'lara yazma
- **Wait** - Belirli süre bekleme
- **Screenshot** - Ekran görüntüsü alma
- **Verify** - Element doğrulama (text, visible, enabled, vb.)
- **Scroll** - Sayfa kaydırma (up, down, left, right)
- **Hover** - Element'lerin üzerine gelme
- **Key** - Klavye tuşlarına basma

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Chrome/Chromium browser (Playwright tarafından otomatik kurulur)

## 🛠️ Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd CosmicQA
```

### 2. Dependencies'leri Kurun
```bash
npm install
```

### 3. Playwright'i Kurun
```bash
npx playwright install chromium
```

## 🚀 Çalıştırma

### Development Mode (Önerilen)
Hem frontend hem backend'i aynı anda çalıştırmak için:
```bash
npm run dev:full
```

Bu komut şunları başlatır:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Ayrı Ayrı Çalıştırma
Frontend:
```bash
npm run dev
```

Backend:
```bash
npm run server:dev
```

## 📖 Kullanım

### 1. Test Builder
- http://localhost:3000/test-builder adresine gidin
- Sol panelden action'ları sürükleyip test adımları oluşturun
- Action'lara çift tıklayarak özelliklerini düzenleyin
- Adımlar arasında bağlantı oluşturun
- "Save" butonu ile workflow'u kaydedin
- "Run" butonu ile testi çalıştırın

### 2. Test Management
- http://localhost:3000/tests adresine gidin
- Kaydedilen test workflow'larını görüntüleyin
- Test'leri çalıştırın, düzenleyin, kopyalayın veya silin
- Toplu işlemler yapın (çoklu seçim)
- Import/Export ile test'leri paylaşın

### 3. Test Execution
- Test'ler Playwright ile gerçek browser'da çalışır
- Her adım için otomatik screenshot alınır
- Hata durumunda detaylı log ve screenshot
- Real-time progress takibi
- Test sonuçları backend'de saklanır

## 🔧 API Endpoints

### Backend API (Port 3001)
- `POST /api/execute` - Test workflow'u çalıştır
- `GET /api/execution/:id` - Execution durumu sorgula
- `GET /api/results/:id` - Test sonuçlarını getir
- `DELETE /api/execution/:id` - Execution'ı iptal et
- `GET /api/health` - Server durumu kontrol et
- `GET /screenshots/:filename` - Screenshot'ları serve et

### WebSocket Events
- `execution:started` - Test başladı
- `execution:progress` - Test ilerlemesi
- `execution:completed` - Test tamamlandı
- `execution:failed` - Test başarısız
- `step:started` - Adım başladı
- `step:completed` - Adım tamamlandı

## 📁 Proje Yapısı

```
CosmicQA-Deneme/
├── src/                          # Frontend (Next.js)
│   ├── app/                      # App Router pages
│   │   ├── test-builder/         # Visual test builder
│   │   ├── tests/                # Test management
│   │   └── ...
│   ├── components/               # React components
│   │   ├── test-builder/         # Test builder components
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and helpers
│   └── types/                    # TypeScript definitions
├── server/                       # Backend (Express.js + Playwright)
│   ├── index.js                  # Main server file
│   ├── testRunner.js             # Playwright test runner
│   ├── scriptGenerator.js        # Test script generator
│   ├── executions/               # Test execution results
│   └── screenshots/              # Test screenshots
└── package.json
```

## 🎯 Örnek Test Workflow

1. **Navigate** - https://example.com sayfasına git
2. **Click** - Login butonuna tıkla
3. **Type** - Username alanına "testuser" yaz
4. **Type** - Password alanına "password123" yaz
5. **Click** - Submit butonuna tıkla
6. **Wait** - 2 saniye bekle
7. **Verify** - "Welcome" mesajının görünür olduğunu doğrula
8. **Screenshot** - Sonuç ekranının screenshot'ını al

## 🐛 Troubleshooting

### Backend Bağlantı Hataları
- Backend server'ın çalıştığından emin olun (http://localhost:3001/api/health)
- CORS hatası alıyorsanız, backend server'ı yeniden başlatın

### Playwright Hataları
- Chrome/Chromium'un kurulu olduğundan emin olun: `npx playwright install chromium`
- Headless mode'da sorun yaşıyorsanız, test runner'da `headless: false` yapın

### Test Execution Hataları
- Selector'ların doğru olduğundan emin olun
- Element'lerin sayfa yüklendikten sonra mevcut olduğunu kontrol edin
- Timeout değerlerini artırın (30 saniye default)

## 🔮 Gelecek Özellikler

- [ ] Test scheduling (zamanlanmış testler)
- [ ] Test reports ve analytics
- [ ] Parallel test execution
- [ ] CI/CD integration
- [ ] Cloud storage integration
- [ ] Team collaboration features
- [ ] Performance monitoring
- [ ] Mobile testing support

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

**CosmicQA** - Modern test otomasyonu için geliştirilmiştir. 🚀 