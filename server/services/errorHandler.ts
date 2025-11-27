import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    ERROR_CODES,
    ERROR_TYPES,
    ERROR_CATEGORY,
    ERROR_SEVERITY,
    RECOVERY_STRATEGY,
    ErrorSeverity,
    ErrorCategory,
    ErrorCode,
    RecoveryStrategy
} from '../types/errors.js';
import { createAlertProvider, AlertProvider } from '../utils/alertProviders.js';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CustomError extends Error {
    code?: number;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    context?: any;
    timestamp?: string;
    status?: number;
    statusCode?: number;
}

interface ErrorClassification {
    code: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
}

interface LogEntry {
    errorId: string;
    timestamp: string;
    classification: ErrorClassification;
    error: {
        name: string;
        message: string;
        stack?: string;
        code: number;
        category: ErrorCategory;
        severity: ErrorSeverity;
    };
    context: any;
    metadata: any;
}

class ErrorHandler {
    private logsDir: string;
    private errorStats: Map<string, number>;
    private alertThresholds: Record<ErrorSeverity, number>;
    private alertProvider: AlertProvider;

    constructor() {
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.errorStats = new Map(); // Error statistics
        this.alertThresholds = {
            [ERROR_SEVERITY.CRITICAL]: 1,
            [ERROR_SEVERITY.HIGH]: 10,
            [ERROR_SEVERITY.MEDIUM]: 50,
            [ERROR_SEVERITY.LOW]: 100
        };
        this.alertProvider = this.createAlertProvider();
        this.ensureLogsDir();
    }

    /**
     * Create alert provider based on configuration
     */
    private createAlertProvider(): AlertProvider {
        const providerType = process.env.ALERT_PROVIDER || 'console';
        const config = {
            webhookUrl: process.env.ALERT_WEBHOOK_URL,
            emailConfig: {
                to: process.env.ALERT_EMAIL_TO,
                from: process.env.ALERT_EMAIL_FROM,
                smtp: {
                    host: process.env.ALERT_EMAIL_SMTP_HOST,
                    port: process.env.ALERT_EMAIL_SMTP_PORT,
                    auth: {
                        user: process.env.ALERT_EMAIL_SMTP_USER,
                        pass: process.env.ALERT_EMAIL_SMTP_PASS
                    }
                }
            }
        };

        return createAlertProvider(providerType, config);
    }

    private ensureLogsDir(): void {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    // Custom error classes
    public createCustomError(code: number, message: string, context: any = {}): CustomError {
        const errorType = ERROR_TYPES[code];
        const error = new Error(message) as CustomError;
        error.name = errorType?.name || 'CustomError';
        error.code = code;
        error.category = errorType?.category || ERROR_CATEGORY.SYSTEM;
        error.severity = errorType?.severity || ERROR_SEVERITY.MEDIUM;
        error.context = context;
        error.timestamp = new Date().toISOString();
        return error;
    }

    // Error classification
    private classifyError(error: CustomError): ErrorClassification {
        // Check if it's already a custom error
        if (error.code && ERROR_TYPES[error.code]) {
            // @ts-ignore
            return ERROR_TYPES[error.code];
        }

        // Classify based on error properties
        const errorName = error.name?.toLowerCase() || '';
        const errorMessage = error.message?.toLowerCase() || '';

        // Playwright errors
        if (errorName.includes('playwright') || errorMessage.includes('browser')) {
            return {
                code: ERROR_CODES.PLAYWRIGHT_BROWSER_ERROR,
                category: ERROR_CATEGORY.PLAYWRIGHT,
                severity: ERROR_SEVERITY.MEDIUM
            };
        }

        // Network errors
        if (errorName.includes('network') || errorName.includes('timeout') ||
            errorMessage.includes('connection') || errorMessage.includes('timeout')) {
            return {
                code: ERROR_CODES.NETWORK_ERROR,
                category: ERROR_CATEGORY.NETWORK,
                severity: ERROR_SEVERITY.MEDIUM
            };
        }

        // Validation errors
        if (errorName.includes('validation') || errorName.includes('invalid') ||
            errorMessage.includes('required') || errorMessage.includes('invalid')) {
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                category: ERROR_CATEGORY.VALIDATION,
                severity: ERROR_SEVERITY.MEDIUM
            };
        }

        // File system errors
        if (errorName.includes('file') || errorName.includes('fs') ||
            errorMessage.includes('file') || errorMessage.includes('directory')) {
            return {
                code: ERROR_CODES.FILE_NOT_FOUND,
                category: ERROR_CATEGORY.FILESYSTEM,
                severity: ERROR_SEVERITY.MEDIUM
            };
        }

        // Database errors
        if (errorName.includes('database') || errorName.includes('sql') ||
            errorMessage.includes('database') || errorMessage.includes('query')) {
            return {
                code: ERROR_CODES.DATABASE_CONNECTION_ERROR,
                category: ERROR_CATEGORY.DATABASE,
                severity: ERROR_SEVERITY.CRITICAL
            };
        }

        // Default to internal server error
        return {
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            category: ERROR_CATEGORY.SYSTEM,
            severity: ERROR_SEVERITY.CRITICAL
        };
    }

    // Enhanced error logging
    public async logError(error: CustomError, context: unknown = {}): Promise<string> {
        const classification = this.classifyError(error);
        const timestamp = new Date().toISOString();
        const errorId = this.generateErrorId();

        const logEntry: LogEntry = {
            errorId,
            timestamp,
            classification,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code || classification.code,
                category: classification.category,
                severity: classification.severity
            },
            context: {
                ...context as Record<string, unknown>, // Cast to Record<string, unknown> for spread
                environment: process.env.NODE_ENV,
                nodeVersion: process.version,
                platform: process.platform
            },
            metadata: {
                userAgent: (context as any).userAgent, // Access properties safely or define a more specific context type
                ip: (context as any).ip,
                requestId: (context as any).requestId,
                executionId: (context as any).executionId,
                stepId: (context as any).stepId
            }
        };

        // Update error statistics
        this.updateErrorStats(classification);

        // Write to log file
        await this.writeToLogFile(logEntry);

        // Console logging based on severity
        this.logToConsole(logEntry);

        // Check for alerting
        await this.checkAlerting(classification, logEntry);

        return errorId;
    }

    // Generate unique error ID
    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Update error statistics
    private updateErrorStats(classification: ErrorClassification): void {
        const key = `${classification.category}_${classification.severity}`;
        const current = this.errorStats.get(key) || 0;
        this.errorStats.set(key, current + 1);
    }

    // Write to log file
    private async writeToLogFile(logEntry: LogEntry): Promise<void> {
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, `errors-${date}.log`);
        const jsonLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(logFile, jsonLine);
    }

    // Console logging
    private logToConsole(logEntry: LogEntry): void {
        const { error, classification } = logEntry;
        const isProduction = process.env.NODE_ENV === 'production';

        const logLevel = {
            [ERROR_SEVERITY.CRITICAL]: 'error',
            [ERROR_SEVERITY.HIGH]: 'error',
            [ERROR_SEVERITY.MEDIUM]: 'warn',
            [ERROR_SEVERITY.LOW]: 'info'
        }[classification.severity] || 'info';

        const message = `[${classification.category.toUpperCase()}] ${error.message}`;

        if (logLevel === 'error') {
            console.error(message, isProduction ? '' : error.stack);
        } else if (logLevel === 'warn') {
            console.warn(message);
        } else {
            console.log(message);
        }
    }

    // Alerting system
    private async checkAlerting(classification: ErrorClassification, logEntry: LogEntry): Promise<void> {
        const threshold = this.alertThresholds[classification.severity];
        const key = `${classification.category}_${classification.severity}`;
        const count = this.errorStats.get(key) || 0;

        if (count >= threshold) {
            await this.sendAlert(classification, count, logEntry);
        }
    }

    // Send alert using configured provider
    private async sendAlert(classification: ErrorClassification, count: number, logEntry: LogEntry): Promise<void> {
        try {
            // @ts-ignore - AlertProvider types need to be aligned
            await this.alertProvider.send(classification, count, logEntry);
        } catch (error) {
            // Fallback to console if provider fails
            console.error('Alert provider failed:', error);
            console.warn(`🚨 ALERT: ${count} ${classification.severity} errors in ${classification.category}`);
        }
    }

    // Safe error message for client
    public createSafeErrorMessage(error: CustomError, context: any = {}): string {
        const classification = this.classifyError(error);
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            return ERROR_TYPES[classification.code]?.message || 'Beklenmeyen bir hata oluştu';
        }

        return error.message || 'Bilinmeyen hata';
    }

    // API error response
    public formatApiError(error: CustomError, context: any = {}): any {
        const classification = this.classifyError(error);
        const safeMessage = this.createSafeErrorMessage(error, context);

        return {
            error: safeMessage,
            code: classification.code,
            category: classification.category,
            severity: classification.severity,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV !== 'production' && {
                details: error.message,
                stack: error.stack,
                errorId: context.errorId
            })
        };
    }

    // WebSocket error response
    public formatWebSocketError(error: CustomError, context: any = {}): any {
        const classification = this.classifyError(error);
        const safeMessage = this.createSafeErrorMessage(error, context);

        return {
            type: 'error',
            message: safeMessage,
            code: classification.code,
            category: classification.category,
            severity: classification.severity,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV !== 'production' && {
                details: error.message,
                errorId: context.errorId
            })
        };
    }

    // Error recovery strategies
    public getRecoveryStrategy(error: CustomError, context: any = {}): RecoveryStrategy {
        const classification = this.classifyError(error);

        // Critical errors should abort
        if (classification.severity === ERROR_SEVERITY.CRITICAL) {
            return RECOVERY_STRATEGY.ABORT;
        }

        // Network errors can be retried
        if (classification.category === ERROR_CATEGORY.NETWORK) {
            return RECOVERY_STRATEGY.RETRY;
        }

        // Validation errors should skip
        if (classification.category === ERROR_CATEGORY.VALIDATION) {
            return RECOVERY_STRATEGY.SKIP;
        }

        // Default to notify
        return RECOVERY_STRATEGY.NOTIFY;
    }

    // Get error statistics
    public getErrorStats(): Record<string, number> {
        return Object.fromEntries(this.errorStats);
    }

    // Clear error statistics
    public clearErrorStats(): void {
        this.errorStats.clear();
    }
}

export default new ErrorHandler();
