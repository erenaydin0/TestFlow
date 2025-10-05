const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');

class TestScheduler {
  constructor(executeTestFunction, scheduledTestsDir) {
    this.executeTest = executeTestFunction;
    this.scheduledTestsDir = scheduledTestsDir;
    this.activeCrons = new Map(); // scheduleId -> cron task
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🕐 Test Scheduler başlatılıyor...');
    
    try {
      // Tüm zamanlanmış testleri yükle ve cron'ları başlat
      const files = await fs.readdir(this.scheduledTestsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const schedulePath = path.join(this.scheduledTestsDir, file);
            const schedule = await fs.readJson(schedulePath);
            
            if (schedule.enabled && schedule.status === 'active') {
              this.scheduleTest(schedule);
            }
          } catch (error) {
            console.error(`Zamanlama yüklenirken hata (${file}):`, error);
          }
        }
      }
      
      this.isInitialized = true;
      console.log(`✅ ${this.activeCrons.size} aktif zamanlama yüklendi`);
    } catch (error) {
      console.error('Scheduler başlatma hatası:', error);
    }
  }

  scheduleTest(schedule) {
    // Eğer zaten varsa, önce durdur
    this.unscheduleTest(schedule.id);
    
    // Cron ifadesini validate et
    if (!cron.validate(schedule.schedule)) {
      console.error(`❌ Geçersiz cron ifadesi: ${schedule.schedule} (${schedule.name})`);
      return false;
    }
    
    // Yeni cron task oluştur
    const task = cron.schedule(schedule.schedule, async () => {
      console.log(`⏰ Zamanlanmış test çalıştırılıyor: ${schedule.name}`);
      
      try {
        // Test'i çalıştır
        await this.executeTest(schedule);
        
        // Son çalışma zamanını güncelle
        await this.updateLastRun(schedule.id);
        
        console.log(`✅ Zamanlanmış test tamamlandı: ${schedule.name}`);
      } catch (error) {
        console.error(`❌ Zamanlanmış test hatası (${schedule.name}):`, error);
        
        // Retry mantığı
        if (schedule.retryOnFailure && schedule.maxRetries > 0) {
          await this.retryTest(schedule);
        }
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Istanbul' // Türkiye saat dilimi
    });
    
    this.activeCrons.set(schedule.id, task);
    console.log(`📅 Zamanlama eklendi: ${schedule.name} (${schedule.schedule})`);
    
    return true;
  }

  unscheduleTest(scheduleId) {
    const task = this.activeCrons.get(scheduleId);
    if (task) {
      task.stop();
      this.activeCrons.delete(scheduleId);
      console.log(`🛑 Zamanlama durduruldu: ${scheduleId}`);
      return true;
    }
    return false;
  }

  async updateLastRun(scheduleId) {
    try {
      const schedulePath = path.join(this.scheduledTestsDir, `${scheduleId}.json`);
      
      if (await fs.pathExists(schedulePath)) {
        const schedule = await fs.readJson(schedulePath);
        schedule.lastRun = new Date();
        
        // Sonraki çalışma zamanını hesapla (basit versiyon)
        schedule.nextRun = this.calculateNextRun(schedule.schedule);
        
        await fs.writeJson(schedulePath, schedule);
      }
    } catch (error) {
      console.error('Son çalışma zamanı güncellenirken hata:', error);
    }
  }

  calculateNextRun(cronExpression) {
    // Basit bir hesaplama - gerçek bir cron parser kullanılabilir
    // Şimdilik 1 saat sonra olarak ayarla
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  async retryTest(schedule, attempt = 1) {
    if (attempt > schedule.maxRetries) {
      console.log(`❌ Maksimum deneme sayısına ulaşıldı: ${schedule.name}`);
      return;
    }
    
    console.log(`🔄 Test yeniden deneniyor (${attempt}/${schedule.maxRetries}): ${schedule.name}`);
    
    // 30 saniye bekle ve tekrar dene
    setTimeout(async () => {
      try {
        await this.executeTest(schedule);
        console.log(`✅ Test başarılı (deneme ${attempt}): ${schedule.name}`);
      } catch (error) {
        console.error(`❌ Test başarısız (deneme ${attempt}): ${schedule.name}`);
        await this.retryTest(schedule, attempt + 1);
      }
    }, 30000);
  }

  getActiveSchedules() {
    return Array.from(this.activeCrons.keys());
  }

  getScheduleCount() {
    return this.activeCrons.size;
  }

  async reloadSchedule(scheduleId) {
    try {
      const schedulePath = path.join(this.scheduledTestsDir, `${scheduleId}.json`);
      
      if (await fs.pathExists(schedulePath)) {
        const schedule = await fs.readJson(schedulePath);
        
        // Önce mevcut cron'u durdur
        this.unscheduleTest(scheduleId);
        
        // Eğer aktif ise yeniden başlat
        if (schedule.enabled && schedule.status === 'active') {
          this.scheduleTest(schedule);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Zamanlama yeniden yüklenirken hata:', error);
      return false;
    }
  }

  stopAll() {
    console.log('🛑 Tüm zamanlamalar durduruluyor...');
    
    for (const [scheduleId, task] of this.activeCrons.entries()) {
      task.stop();
    }
    
    this.activeCrons.clear();
    console.log('✅ Tüm zamanlamalar durduruldu');
  }
}

module.exports = TestScheduler;
