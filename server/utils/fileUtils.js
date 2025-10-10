/**
 * File utility functions
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Ensure all required directories exist
 * @param {Object} dirs - Object containing directory paths
 */
function ensureDirectoriesExist(dirs) {
  Object.values(dirs).forEach(dir => {
    fs.ensureDirSync(dir);
  });
}

/**
 * Get file path for execution
 * @param {string} executionsDir - Executions directory path
 * @param {string} executionId - Execution ID
 * @returns {string} Full file path
 */
function getExecutionFilePath(executionsDir, executionId) {
  return path.join(executionsDir, `${executionId}.json`);
}

/**
 * Get file path for test
 * @param {string} testsDir - Tests directory path
 * @param {string} testId - Test ID
 * @returns {string} Full file path
 */
function getTestFilePath(testsDir, testId) {
  return path.join(testsDir, `${testId}.json`);
}

/**
 * Get file path for scheduled test
 * @param {string} scheduledTestsDir - Scheduled tests directory path
 * @param {string} scheduleId - Schedule ID
 * @returns {string} Full file path
 */
function getScheduledTestFilePath(scheduledTestsDir, scheduleId) {
  return path.join(scheduledTestsDir, `${scheduleId}.json`);
}

/**
 * Get screenshot directory path for execution
 * @param {string} screenshotsDir - Screenshots directory path
 * @param {string} executionId - Execution ID
 * @returns {string} Full directory path
 */
function getScreenshotDirPath(screenshotsDir, executionId) {
  return path.join(screenshotsDir, executionId);
}

/**
 * Get video file path for execution
 * @param {string} videosDir - Videos directory path
 * @param {string} executionId - Execution ID
 * @returns {string} Full file path
 */
function getVideoFilePath(videosDir, executionId) {
  return path.join(videosDir, `${executionId}.webm`);
}

module.exports = {
  ensureDirectoriesExist,
  getExecutionFilePath,
  getTestFilePath,
  getScheduledTestFilePath,
  getScreenshotDirPath,
  getVideoFilePath
};
