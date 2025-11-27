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
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR'
};

interface LogMetadata {
    [key: string]: unknown;
    error?: Error;
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    [key: string]: unknown;
}

class Logger {
    private logLevel: LogLevel;
    private logsDir: string;
    private colors: Record<string, string>;

    constructor() {
        this.logLevel = this.getLogLevel();
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.colors = {
            DEBUG: '\x1b[36m', // Cyan
            INFO: '\x1b[32m',  // Green
            WARN: '\x1b[33m',  // Yellow
            ERROR: '\x1b[31m'  // Red
        };
        this.ensureLogsDir();
    }

    /**
     * Get log level from environment or config
     */
    private getLogLevel(): LogLevel {
        const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        // @ts-expect-error - indexing with string
        return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
    }

    /**
     * Ensure logs directory exists
     */
    private ensureLogsDir(): void {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    /**
     * Check if log level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        return level >= this.logLevel;
    }

    /**
     * Format log entry for console output
     */
    private formatConsoleLog(level: LogLevel, message: string, metadata: LogMetadata): string {
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
    private async writeToFile(level: LogLevel, message: string, metadata: LogMetadata): Promise<void> {
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
    public log(level: LogLevel, message: string, metadata: LogMetadata = {}): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const levelName = LOG_LEVEL_NAMES[level];

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            message,
            ...metadata
        };

        // Console logging
        if (this.shouldLog(level)) {
            const color = this.colors[levelName] || '\x1b[37m'; // White default
            const reset = '\x1b[0m';

            // console methods are dynamic, but we know they exist for these levels
            const consoleMethod = console[levelName.toLowerCase() as 'debug' | 'info' | 'warn' | 'error'];

            if (consoleMethod) {
                consoleMethod(`${color}[${logEntry.timestamp}] [${levelName}] ${message}${reset}`);

                if (Object.keys(metadata).length > 0) {
                    consoleMethod(metadata);
                }
            } else {
                // Fallback for unknown console methods
                console.log(`${color}[${logEntry.timestamp}] [${levelName}] ${message}${reset}`);
                if (Object.keys(metadata).length > 0) {
                    console.log(metadata);
                }
            }
        }

        // File logging
        this.writeToFile(level, message, metadata).catch(err => {
            console.error('Failed to write to log file:', err);
        });
    }

    /**
     * Log debug message
     */
    public debug(message: string, metadata: LogMetadata = {}): void {
        this.log(LOG_LEVELS.DEBUG, message, metadata);
    }

    /**
     * Log info message
     */
    public info(message: string, metadata: LogMetadata = {}): void {
        this.log(LOG_LEVELS.INFO, message, metadata);
    }

    /**
     * Log warning message
     */
    public warn(message: string, metadata: LogMetadata = {}): void {
        this.log(LOG_LEVELS.WARN, message, metadata);
    }

    /**
     * Log error message
     */
    public error(message: string, metadata: LogMetadata = {}): void {
        this.log(LOG_LEVELS.ERROR, message, metadata);
    }

    /**
     * Log with request context
     */
    public logRequest(level: LogLevel, message: string, req: { id?: string; headers: Record<string, unknown>; method: string; url: string; ip?: string; connection: { remoteAddress?: string } }, metadata: LogMetadata = {}): void {
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
    public logExecution(level: LogLevel, message: string, executionId: string, metadata: LogMetadata = {}): void {
        const executionMetadata = {
            ...metadata,
            executionId
        };

        this.log(level, message, executionMetadata);
    }

    /**
     * Performance logging
     */
    public logPerformance(operation: string, duration: number, metadata: LogMetadata = {}): void {
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
const logger = new Logger();
export default logger;
