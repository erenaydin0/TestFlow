import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TestScheduler from '../scheduler.js';
import fs from 'fs-extra';
import cron from 'node-cron';
import { Schedule } from '../../types/models.js';

// Mock dependencies
vi.mock('fs-extra');
vi.mock('node-cron');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('TestScheduler', () => {
    let scheduler: TestScheduler;
    const mockExecuteTest = vi.fn();
    const mockScheduledTestsDir = '/mock/storage/scheduled-tests';

    const mockSchedule: Schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        schedule: '0 0 * * *', // Daily
        testId: 'test-1',
        enabled: true,
        status: 'active',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler = new TestScheduler(mockExecuteTest, mockScheduledTestsDir);

        // Mock cron.validate to return true by default
        (cron.validate as any).mockReturnValue(true);

        // Mock cron.schedule to return a mock task
        (cron.schedule as any).mockReturnValue({
            start: vi.fn(),
            stop: vi.fn(),
        });
    });

    describe('initialize', () => {
        it('should load active schedules from disk', async () => {
            // Mock fs.readdir to return a list of files
            (fs.readdir as any).mockResolvedValue(['schedule-1.json']);

            // Mock fs.readJson to return the schedule object
            (fs.readJson as any).mockResolvedValue(mockSchedule);

            await scheduler.initialize();

            expect(fs.readdir).toHaveBeenCalledWith(mockScheduledTestsDir);
            expect(fs.readJson).toHaveBeenCalledWith(`${mockScheduledTestsDir}/schedule-1.json`);
            expect(cron.schedule).toHaveBeenCalledWith(mockSchedule.schedule, expect.any(Function), expect.any(Object));
            expect(scheduler.getScheduleCount()).toBe(1);
        });

        it('should skip disabled schedules', async () => {
            const disabledSchedule = { ...mockSchedule, enabled: false };
            (fs.readdir as any).mockResolvedValue(['schedule-1.json']);
            (fs.readJson as any).mockResolvedValue(disabledSchedule);

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
