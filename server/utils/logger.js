/**
 * Structured Logger
 * Consistent, structured logging system for the application
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

class Logger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.ensureLogsDir();
  }

  /**
   * Get log level from environment or config
   */
  getLogLevel() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    return level >= this.logLevel;
  }

  /**
   * Format log entry for console output
   */
  formatConsoleLog(level, message, metadata) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const prefix = `[${timestamp}] [${levelName}]`;
    
    if (Object.keys(metadata).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(metadata, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  /**
   * Write log to file (JSON lines format)
   */
  async writeToFile(level, message, metadata) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logsDir, `app-${date}.log`);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      ...metadata,
      environment: process.env.NODE_ENV,
      pid: process.pid
    };
    
    const jsonLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(logFile, jsonLine);
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write log to file:', error);
      console.error('Log entry:', logEntry);
    }
  }

  /**
   * Core log method
   */
  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    // Console output (formatted for readability)
    const consoleOutput = this.formatConsoleLog(level, message, metadata);
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(consoleOutput);
        break;
      case LOG_LEVELS.INFO:
        console.log(consoleOutput);
        break;
      case LOG_LEVELS.WARN:
        console.warn(consoleOutput);
        break;
      case LOG_LEVELS.ERROR:
        console.error(consoleOutput);
        if (metadata.error && metadata.error.stack) {
          console.error(metadata.error.stack);
        }
        break;
    }

    // File output (JSON lines format)
    this.writeToFile(level, message, metadata).catch(err => {
      console.error('Logger: Failed to write to file', err);
    });
  }

  /**
   * Log debug message
   */
  debug(message, metadata = {}) {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  /**
   * Log error message
   */
  error(message, metadata = {}) {
    this.log(LOG_LEVELS.ERROR, message, metadata);
  }

  /**
   * Log with request context
   */
  logRequest(level, message, req, metadata = {}) {
    const requestMetadata = {
      ...metadata,
      requestId: req.id || req.headers['x-request-id'],
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    this.log(level, message, requestMetadata);
  }

  /**
   * Log with execution context
   */
  logExecution(level, message, executionId, metadata = {}) {
    const executionMetadata = {
      ...metadata,
      executionId
    };
    
    this.log(level, message, executionMetadata);
  }

  /**
   * Performance logging
   */
  logPerformance(operation, duration, metadata = {}) {
    const perfMetadata = {
      ...metadata,
      operation,
      duration,
      unit: 'ms'
    };
    
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, perfMetadata);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, perfMetadata);
    }
  }
}

// Export singleton instance
export default new Logger();

