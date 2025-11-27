/**
 * File utility functions
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
path.dirname(__filename);

/**
 * Ensure all required directories exist
 * @param dirs - Object containing directory paths
 */
function ensureDirectoriesExist(dirs: Record<string, string>): void {
    Object.values(dirs).forEach(dir => {
        fs.ensureDirSync(dir);
    });
}

/**
 * Get file path for execution
 * @param executionsDir - Executions directory path
 * @param executionId - Execution ID
 * @returns Full file path
 */
function getExecutionFilePath(executionsDir: string, executionId: string): string {
    return path.join(executionsDir, `${executionId}.json`);
}

/**
 * Get file path for test
 * @param testsDir - Tests directory path
 * @param testId - Test ID
 * @returns Full file path
 */
function getTestFilePath(testsDir: string, testId: string): string {
    return path.join(testsDir, `${testId}.json`);
}

/**
 * Get file path for scheduled test
 * @param scheduledTestsDir - Scheduled tests directory path
 * @param scheduleId - Schedule ID
 * @returns Full file path
 */
function getScheduledTestFilePath(scheduledTestsDir: string, scheduleId: string): string {
    return path.join(scheduledTestsDir, `${scheduleId}.json`);
}

/**
 * Get screenshot directory path for execution
 * @param screenshotsDir - Screenshots directory path
 * @param executionId - Execution ID
 * @returns Full directory path
 */
function getScreenshotDirPath(screenshotsDir: string, executionId: string): string {
    return path.join(screenshotsDir, executionId);
}

/**
 * Get video file path for execution
 * @param videosDir - Videos directory path
 * @param executionId - Execution ID
 * @returns Full file path
 */
function getVideoFilePath(videosDir: string, executionId: string): string {
    return path.join(videosDir, `${executionId}.webm`);
}

export {
    ensureDirectoriesExist,
    getExecutionFilePath,
    getTestFilePath,
    getScheduledTestFilePath,
    getScreenshotDirPath,
    getVideoFilePath
};
