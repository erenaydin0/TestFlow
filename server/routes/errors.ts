/**
 * Error reporting routes
 */

import express, { Request, Response } from 'express';
import errorHandler from '../services/errorHandler.js';
import { ERROR_CODES } from '../types/errors.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

interface ErrorReport {
    code: number;
    category: any;
    severity: any;
    message: string;
    details?: any;
    errorId?: string;
    context?: any;
}

/**
 * Report frontend error
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { code, category, severity, message, details, errorId, context } = req.body as ErrorReport;

        // Create error object
        const error: any = new Error(message);
        error.code = code;
        error.category = category;
        error.severity = severity;
        error.details = details;
        error.errorId = errorId;

        // Add request context
        const errorContext = {
            ...context,
            // @ts-ignore
            requestId: req.id,
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            // @ts-ignore
            userId: req.user?.id
        };

        // Log the error
        const loggedErrorId = await errorHandler.logError(error, errorContext);

        res.json({
            success: true,
            errorId: loggedErrorId,
            message: 'Error reported successfully'
        });
    } catch (error) {
        console.error('Error reporting failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report error'
        });
    }
});

/**
 * Get error statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = errorHandler.getErrorStats();
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to get error stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get error statistics'
        });
    }
});

/**
 * Clear error statistics
 */
router.delete('/stats', async (req: Request, res: Response) => {
    try {
        errorHandler.clearErrorStats();
        res.json({
            success: true,
            message: 'Error statistics cleared'
        });
    } catch (error) {
        console.error('Failed to clear error stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear error statistics'
        });
    }
});

/**
 * Get error logs (admin only)
 * Supports pagination, filtering, and sorting
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        // TODO: Add authentication check (middleware olarak eklenebilir)
        // if (!req.user || !req.user.isAdmin) {
        //   return res.status(403).json({ success: false, message: 'Forbidden' });
        // }

        // Parse query parameters
        const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 1000); // Max 1000
        const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);
        const severity = req.query.severity as string;
        const category = req.query.category as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const sort = (req.query.sort as string) || 'desc'; // 'asc' or 'desc'

        const logsDir = path.join(__dirname, '..', 'logs');

        // Get log files (today and optionally date range)
        let logFiles = [];
        if (startDate && endDate) {
            // Date range: get all log files in range
            const start = new Date(startDate);
            const end = new Date(endDate);
            const current = new Date(start);

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                const logFile = path.join(logsDir, `errors-${dateStr}.log`);
                if (await fs.pathExists(logFile)) {
                    logFiles.push(logFile);
                }
                current.setDate(current.getDate() + 1);
            }
        } else {
            // Default: today's log file
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(logsDir, `errors-${today}.log`);
            if (await fs.pathExists(logFile)) {
                logFiles.push(logFile);
            }
        }

        // Read and parse all log files
        let allLogs = [];
        for (const logFile of logFiles) {
            try {
                const logContent = await fs.readFile(logFile, 'utf8');
                const fileLogs = logContent.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(log => log !== null);

                allLogs.push(...fileLogs);
            } catch (error) {
                console.error(`Error reading log file ${logFile}:`, error);
            }
        }

        // Apply filters
        let filteredLogs = allLogs;

        if (severity) {
            filteredLogs = filteredLogs.filter(log =>
                log.error?.severity?.toLowerCase() === severity.toLowerCase()
            );
        }

        if (category) {
            filteredLogs = filteredLogs.filter(log =>
                log.error?.category?.toLowerCase() === category.toLowerCase()
            );
        }

        if (startDate || endDate) {
            filteredLogs = filteredLogs.filter(log => {
                const logDate = new Date(log.timestamp);
                if (startDate && logDate < new Date(startDate)) return false;
                if (endDate && logDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Sort by timestamp
        filteredLogs.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sort === 'asc' ? timeA - timeB : timeB - timeA;
        });

        // Apply pagination
        const total = filteredLogs.length;
        const paginatedLogs = filteredLogs.slice(offset, offset + limit);

        res.json({
            success: true,
            logs: paginatedLogs,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            },
            filters: {
                severity: severity || null,
                category: category || null,
                startDate: startDate || null,
                endDate: endDate || null,
                sort
            }
        });
    } catch (error: any) {
        console.error('Failed to get error logs:', error);
        await errorHandler.logError(error, { endpoint: '/api/errors/logs' });
        res.status(500).json({
            success: false,
            message: 'Failed to get error logs',
            error: errorHandler.createSafeErrorMessage(error)
        });
    }
});

export default router;
