# CosmicQA Agent - Docker

Bu dizin, CosmicQA test agent'ını Docker üzerinde çalıştırmak için gerekli dosyaları ve talimatları içerir.

## Ön Gereksinimler

*   Docker Desktop (Mac/Windows) veya Docker Engine (Linux)
*   Supabase projesi ve gerekli `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` değişkenleri.

## Kurulum ve Çalıştırma

1.  Proje kök dizininde `.env.local` dosyasının olduğundan ve gerekli değişkenleri içerdiğinden emin olun.

2.  Container'ı derleyin ve çalıştırın:

    ```bash
    docker compose up -d --build
    ```

3.  Logları izlemek için:

    ```bash
    docker compose logs -f
    ```

## Yapılandırma

`docker-compose.yml` dosyası, yerel `.env` ve `.env.local` dosyalarınızı otomatik olarak container içine yükler.

## Nasıl Çalışır?

*   Container başlatıldığında `agent/index.ts` scripti çalışır.
*   Supabase Realtime ile yeni iş kuyruğunu dinler.
*   Zamanlanmış testleri (ScheduledTest) kontrol eder ve zamanı gelince çalıştırır.
*   Playwright tarayıcıları container içinde yüklü olduğu için ek kurulum gerektirmez.
