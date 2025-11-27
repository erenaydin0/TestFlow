import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TestScheduler from '../scheduler.js';
import cron from 'node-cron';
import { Schedule } from '../../types/models.js';

// Mock dependencies
vi.mock('fs-extra'); // Keep fs-extra mock just in case, but we won't use it for scheduler logic
vi.mock('node-cron');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            scheduledTest: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            }
        }
    };
});

vi.mock('../../lib/prisma.js', () => ({
    prisma: mockPrisma
}));

describe('TestScheduler', () => {
    let scheduler: TestScheduler;
    const mockExecuteTest = vi.fn();

    const mockSchedule: Schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        schedule: '0 0 * * *', // Daily
        testId: 'test-1',
        enabled: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler = new TestScheduler(mockExecuteTest);

        // Mock cron.validate to return true by default
        (cron.validate as any).mockReturnValue(true);

        // Mock cron.schedule to return a mock task
        (cron.schedule as any).mockReturnValue({
            start: vi.fn(),
            stop: vi.fn(),
        });
    });

    describe('initialize', () => {
        it('should load active schedules from DB', async () => {
            // Mock prisma.scheduledTest.findMany to return schedules
            mockPrisma.scheduledTest.findMany.mockResolvedValue([mockSchedule]);

            await scheduler.initialize();

            expect(mockPrisma.scheduledTest.findMany).toHaveBeenCalled();
            expect(cron.schedule).toHaveBeenCalledWith(mockSchedule.schedule, expect.any(Function), expect.any(Object));
            expect(scheduler.getScheduleCount()).toBe(1);
        });

        it('should skip disabled schedules', async () => {
            const disabledSchedule = { ...mockSchedule, enabled: false };
            mockPrisma.scheduledTest.findMany.mockResolvedValue([disabledSchedule]);

            await scheduler.initialize();

            expect(cron.schedule).not.toHaveBeenCalled();
            expect(scheduler.getScheduleCount()).toBe(0);
        });
    });

    describe('scheduleTest', () => {
        it('should schedule a valid test', () => {
            const result = scheduler.scheduleTest(mockSchedule);

            expect(result).toBe(true);
            expect(cron.validate).toHaveBeenCalledWith(mockSchedule.schedule);
            expect(cron.schedule).toHaveBeenCalled();
            expect(scheduler.getScheduleCount()).toBe(1);
        });

        it('should fail for invalid cron expression', () => {
            (cron.validate as any).mockReturnValue(false);
            const invalidSchedule = { ...mockSchedule, schedule: 'invalid-cron' };

            const result = scheduler.scheduleTest(invalidSchedule);

            expect(result).toBe(false);
            expect(cron.schedule).not.toHaveBeenCalled();
            expect(scheduler.getScheduleCount()).toBe(0);
        });

        it('should overwrite existing schedule with same ID', () => {
            scheduler.scheduleTest(mockSchedule);
            scheduler.scheduleTest(mockSchedule); // Schedule again

            expect(scheduler.getScheduleCount()).toBe(1); // Should still be 1
            // First task should be stopped (we can't easily check this without more complex mocking, but logic implies it)
        });
    });

    describe('unscheduleTest', () => {
        it('should stop and remove a scheduled test', () => {
            scheduler.scheduleTest(mockSchedule);
            expect(scheduler.getScheduleCount()).toBe(1);

            const result = scheduler.unscheduleTest(mockSchedule.id);

            expect(result).toBe(true);
            expect(scheduler.getScheduleCount()).toBe(0);
        });

        it('should return false if schedule does not exist', () => {
            const result = scheduler.unscheduleTest('non-existent-id');
            expect(result).toBe(false);
        });
    });
});
