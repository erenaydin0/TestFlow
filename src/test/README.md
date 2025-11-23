# Test Altyapısı

CosmicQA projesi için test altyapısı Vitest ve React Testing Library kullanılarak kurulmuştur.

## Kurulum

Test dependencies'leri kurmak için:

```bash
npm install
```

## Test Komutları

### Tüm testleri çalıştır
```bash
npm test
```

### Watch mode (değişiklikleri izleyerek test çalıştır)
```bash
npm run test:watch
```

### Test coverage raporu
```bash
npm run test:coverage
```

### Test UI (interaktif test arayüzü)
```bash
npm run test:ui
```

## Test Yapısı

```
src/
├── test/
│   ├── setup.ts          # Test setup ve mocks
│   └── README.md         # Bu dosya
├── utils/
│   ├── __tests__/        # Utils testleri
│   │   ├── config.test.ts
│   │   ├── storage.test.ts
│   │   └── utils.test.ts
│   └── api/
│       └── __tests__/    # API testleri
│           └── client.test.ts
├── hooks/
│   └── __tests__/        # Hook testleri
│       └── usePagination.test.ts
└── components/
    └── common/
        └── __tests__/    # Component testleri
            ├── StatusBadge.test.tsx
            └── ErrorBoundary.test.tsx
```

## Test Coverage Hedefleri

- **Lines**: %80
- **Functions**: %80
- **Branches**: %80
- **Statements**: %80

## Test Yazım Kuralları

1. **Test dosyaları**: `*.test.ts` veya `*.test.tsx` uzantısı kullanın
2. **Test klasörleri**: `__tests__` klasörü içinde organize edin
3. **Test isimlendirme**: `describe` ve `it` kullanarak açıklayıcı isimler verin
4. **Mock'lar**: `vitest` mock fonksiyonlarını kullanın
5. **Cleanup**: Her test sonrası otomatik cleanup yapılır

## Örnek Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatDuration } from '../utils';

describe('formatDuration', () => {
  it('should format milliseconds correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
  });
});
```

## Mock'lar

Test setup dosyasında (`src/test/setup.ts`) şu mock'lar hazır:

- Next.js router (`useRouter`, `useSearchParams`, `usePathname`)
- `window.matchMedia`
- `localStorage` ve `sessionStorage`

## Daha Fazla Bilgi

- [Vitest Dokümantasyonu](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Jest DOM](https://github.com/testing-library/jest-dom)

