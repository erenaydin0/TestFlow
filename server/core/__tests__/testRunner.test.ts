import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TestRunner from '../testRunner.js';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

// Mock dependencies
vi.mock('playwright', () => ({
    chromium: {
        launch: vi.fn(),
    },
    firefox: {
        launch: vi.fn(),
    },
    webkit: {
        launch: vi.fn(),
    },
}));

vi.mock('fs-extra', () => ({
    default: {
        ensureDirSync: vi.fn(),
        pathExists: vi.fn(),
        move: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
        appendFile: vi.fn(),
    },
}));

vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('../config.js', () => ({
    default: {
        enableDebugLogs: false,
    },
}));

describe('TestRunner', () => {
    let runner: TestRunner;
    let mockBrowser: any;
    let mockContext: any;
    let mockPage: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup Playwright mocks
        mockPage = {
            goto: vi.fn(),
            click: vi.fn(),
            fill: vi.fn(),
            waitForSelector: vi.fn(),
            waitForTimeout: vi.fn(),
            screenshot: vi.fn(),
            setDefaultTimeout: vi.fn(),
            on: vi.fn(),
            $: vi.fn(),
            locator: vi.fn().mockReturnValue({
                toHaveText: vi.fn(),
                toBeVisible: vi.fn(),
            }),
            video: vi.fn().mockReturnValue({
                path: vi.fn().mockResolvedValue('/path/to/video.webm'),
            }),
        };

        mockContext = {
            newPage: vi.fn().mockResolvedValue(mockPage),
            close: vi.fn().mockResolvedValue(undefined),
        };

        mockBrowser = {
            newContext: vi.fn().mockResolvedValue(mockContext),
            close: vi.fn().mockResolvedValue(undefined),
        };

        (chromium.launch as any).mockResolvedValue(mockBrowser);

        runner = new TestRunner('/mock/screenshots');
    });

    describe('initializeBrowser', () => {
        it('should launch chromium by default', async () => {
            await runner.initializeBrowser();
            expect(chromium.launch).toHaveBeenCalled();
            expect(mockBrowser.newContext).toHaveBeenCalled();
            expect(mockContext.newPage).toHaveBeenCalled();
        });

        it('should set viewport size', async () => {
            const viewport = { width: 1920, height: 1080 };
            await runner.initializeBrowser({ viewport });
            expect(mockBrowser.newContext).toHaveBeenCalledWith(expect.objectContaining({ viewport }));
        });
    });

    describe('executeStep', () => {
        beforeEach(async () => {
            await runner.initializeBrowser();
        });

        it('should execute navigate step', async () => {
            const step = {
                type: 'navigate',
                config: { url: 'https://example.com' }
            };

            const result = await runner.executeStep(step, 'exec-1');

            expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
            expect(result.success).toBe(true);
        });

        it('should execute click step', async () => {
            const step = {
                type: 'click',
                config: { selector: '#btn' }
            };

            // Mock element existence
            mockPage.$.mockResolvedValue({});

            const result = await runner.executeStep(step, 'exec-1');

            expect(mockPage.waitForSelector).toHaveBeenCalled();
            expect(mockPage.click).toHaveBeenCalledWith('#btn');
            expect(result.success).toBe(true);
        });

        it('should handle step failure', async () => {
            const step = {
                type: 'click',
                config: { selector: '#non-existent' }
            };

            // Mock failure
            mockPage.$.mockResolvedValue(null); // Element not found

            const result = await runner.executeStep(step, 'exec-1');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('closeBrowser', () => {
        it('should close browser and context', async () => {
            await runner.initializeBrowser();
            await runner.closeBrowser();

            expect(mockContext.close).toHaveBeenCalled();
            expect(mockBrowser.close).toHaveBeenCalled();
        });
    });
});
