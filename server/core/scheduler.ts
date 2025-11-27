import cron from 'node-cron';
import { Cron } from 'croner';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Schedule } from '@shared/types/index.js';

type ExecuteTestFunction = (schedule: Schedule) => Promise<any>;

// Helper to map DB schedule to API schedule
const mapScheduleFromDb = (dbSchedule: any): Schedule => {
    return {
        ...dbSchedule,
        lastRun: dbSchedule.lastRun ? new Date(dbSchedule.lastRun) : undefined,
        nextRun: dbSchedule.nextRun ? new Date(dbSchedule.nextRun) : undefined,
        createdAt: new Date(dbSchedule.createdAt),
        updatedAt: new Date(dbSchedule.updatedAt)
    };
};

class TestScheduler {
    private executeTest: ExecuteTestFunction;
    private activeCrons: Map<string, cron.ScheduledTask>;
    private isInitialized: boolean;

    constructor(executeTestFunction: ExecuteTestFunction) {
        this.executeTest = executeTestFunction;
        this.activeCrons = new Map(); // scheduleId -> cron task
        this.isInitialized = false;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        logger.info('🕐 Test Scheduler başlatılıyor...');

        try {
            // Tüm zamanlanmış testleri yükle ve cron'ları başlat
            const dbSchedules = await prisma.scheduledTest.findMany();

            for (const dbSchedule of dbSchedules) {
                try {
                    const schedule = mapScheduleFromDb(dbSchedule);

                    if (schedule.enabled && schedule.status === 'active') {
                        this.scheduleTest(schedule);
                    }
                } catch (error: unknown) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.error(`Zamanlama yüklenirken hata (${dbSchedule.id}):`, { error: err });
                }
            }

            this.isInitialized = true;
            logger.info(`✅ ${this.activeCrons.size} aktif zamanlama yüklendi`);
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('Scheduler başlatma hatası:', { error: err });
        }
    }

    scheduleTest(schedule: Schedule): boolean {
        // Eğer zaten varsa, önce durdur
        this.unscheduleTest(schedule.id);

        // Cron ifadesini validate et
        if (!cron.validate(schedule.schedule)) {
            logger.error(`❌ Geçersiz cron ifadesi: ${schedule.schedule} (${schedule.name})`);
            return false;
        }

        // Yeni cron task oluştur
        const task = cron.schedule(schedule.schedule, async () => {
            logger.info(`⏰ Zamanlanmış test çalıştırılıyor: ${schedule.name}`, { scheduleId: schedule.id });

            try {
                // Test'i çalıştır
                await this.executeTest(schedule);

                // Son çalışma zamanını güncelle
                await this.updateLastRun(schedule.id);

                logger.info(`✅ Zamanlanmış test tamamlandı: ${schedule.name}`, { scheduleId: schedule.id });
            } catch (error: any) {
                logger.error(`❌ Zamanlanmış test hatası (${schedule.name}):`, { error: error.message, scheduleId: schedule.id });

                // Retry mantığı
                if (schedule.retryOnFailure && (schedule.maxRetries || 0) > 0) {
                    await this.retryTest(schedule);
                }
            }
        }, {
            timezone: 'Europe/Istanbul' // Türkiye saat dilimi
        });

        this.activeCrons.set(schedule.id, task);
        logger.info(`📅 Zamanlama eklendi: ${schedule.name} (${schedule.schedule})`);

        return true;
    }

    unscheduleTest(scheduleId: string): boolean {
        const task = this.activeCrons.get(scheduleId);
        if (task) {
            task.stop();
            this.activeCrons.delete(scheduleId);
            logger.info(`🛑 Zamanlama durduruldu: ${scheduleId}`);
            return true;
        }
        return false;
    }

    async updateLastRun(scheduleId: string): Promise<void> {
        try {
            const schedule = await prisma.scheduledTest.findUnique({ where: { id: scheduleId } });

            if (schedule) {
                const nextRun = this.calculateNextRun(schedule.schedule);

                await prisma.scheduledTest.update({
                    where: { id: scheduleId },
                    data: {
                        lastRun: new Date(),
                        nextRun: nextRun
                    }
                });
            }
        } catch (error: any) {
            logger.error('Son çalışma zamanı güncellenirken hata:', { error: error.message, scheduleId });
        }
    }

    calculateNextRun(cronExpression: string): Date {
        try {
            // Önce cron ifadesini validate et
            if (!cron.validate(cronExpression)) {
                logger.error(`Geçersiz cron ifadesi: ${cronExpression}`);
                return new Date(Date.now() + 60 * 60 * 1000); // 1 saat sonra
            }

            // Croner kullanarak sonraki çalışma zamanını hesapla
            const job = new Cron(cronExpression, { timezone: 'Europe/Istanbul' });
            const nextRun = job.nextRun();

            if (nextRun) {
                return new Date(nextRun);
            }

            // Fallback: 1 saat sonra
            return new Date(Date.now() + 60 * 60 * 1000);
        } catch (error: any) {
            logger.error('Sonraki çalışma zamanı hesaplanamadı:', { error: error.message });
            return new Date(Date.now() + 60 * 60 * 1000);
        }
    }

    async retryTest(schedule: Schedule, attempt: number = 1): Promise<void> {
        if (attempt > (schedule.maxRetries || 0)) {
            logger.warn(`❌ Maksimum deneme sayısına ulaşıldı: ${schedule.name}`, { scheduleId: schedule.id });
            return;
        }

        logger.info(`🔄 Test yeniden deneniyor (${attempt}/${schedule.maxRetries}): ${schedule.name}`, { scheduleId: schedule.id });

        // 30 saniye bekle ve tekrar dene
        setTimeout(async () => {
            try {
                await this.executeTest(schedule);
                logger.info(`✅ Test başarılı (deneme ${attempt}): ${schedule.name}`, { scheduleId: schedule.id });
            } catch (error: any) {
                logger.error(`❌ Test başarısız (deneme ${attempt}): ${schedule.name}`, { error: error.message, scheduleId: schedule.id });
                await this.retryTest(schedule, attempt + 1);
            }
        }, 30000);
    }

    getActiveSchedules(): string[] {
        return Array.from(this.activeCrons.keys());
    }

    getScheduleCount(): number {
        return this.activeCrons.size;
    }

    async reloadSchedule(scheduleId: string): Promise<boolean> {
        try {
            const dbSchedule = await prisma.scheduledTest.findUnique({ where: { id: scheduleId } });

            if (dbSchedule) {
                const schedule = mapScheduleFromDb(dbSchedule);

                // Önce mevcut cron'u durdur
                this.unscheduleTest(scheduleId);

                // Eğer aktif ise yeniden başlat
                if (schedule.enabled && schedule.status === 'active') {
                    this.scheduleTest(schedule);
                }

                return true;
            }

            return false;
        } catch (error: any) {
            logger.error('Zamanlama yeniden yüklenirken hata:', { error: error.message, scheduleId });
            return false;
        }
    }

    async fixExistingSchedules(): Promise<void> {
        try {
            logger.info('🔧 Mevcut zamanlamaların nextRun değerleri düzeltiliyor...');

            const dbSchedules = await prisma.scheduledTest.findMany();

            for (const dbSchedule of dbSchedules) {
                try {
                    const schedule = mapScheduleFromDb(dbSchedule);

                    // nextRun değerini yeniden hesapla
                    const newNextRun = this.calculateNextRun(schedule.schedule);

                    if (schedule.nextRun && newNextRun.getTime() !== new Date(schedule.nextRun).getTime()) {
                        await prisma.scheduledTest.update({
                            where: { id: schedule.id },
                            data: { nextRun: newNextRun }
                        });
                        logger.info(`✅ ${schedule.name} nextRun düzeltildi: ${newNextRun.toISOString()}`);
                    }
                } catch (error: any) {
                    logger.error(`Hata (${dbSchedule.id}):`, { error: error.message });
                }
            }

            logger.info('✅ Tüm zamanlamalar düzeltildi');
        } catch (error: any) {
            logger.error('Zamanlamalar düzeltilirken hata:', { error: error.message });
        }
    }

    stopAll(): void {
        logger.info('🛑 Tüm zamanlamalar durduruluyor...');

        for (const [scheduleId, task] of this.activeCrons.entries()) {
            task.stop();
        }

        this.activeCrons.clear();
        logger.info('✅ Tüm zamanlamalar durduruldu');
    }
}

export default TestScheduler;
