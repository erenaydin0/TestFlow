/**
 * Health check routes
 */

import express, { Request, Response } from 'express';
import errorHandler from '../services/errorHandler.js';
import HealthChecker from '../services/healthChecker.js';
import TestScheduler from '../core/scheduler.js';

const router = express.Router();

/**
 * Create health routes instance
 */
function createHealthRoutes(activeExecutions: Map<any, any>, clients: Set<any>, testScheduler: TestScheduler, healthChecker: typeof HealthChecker) {
    // Health check endpoints
    router.get('/', async (req: Request, res: Response) => {
        try {
            const health = await healthChecker.generateHealthReport(
                activeExecutions,
                clients,
                testScheduler
            );

            const statusCode = health.status === 'error' ? 503 : 200;
            res.status(statusCode).json(health);
        } catch (error: any) {
            await errorHandler.logError(error, { endpoint: '/api/health' });
            res.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                message: 'Health check failed',
                error: errorHandler.createSafeErrorMessage(error)
            });
        }
    });

    // Quick health check (lightweight)
    router.get('/quick', (req: Request, res: Response) => {
        try {
            const health = healthChecker.getQuickHealth(activeExecutions, clients, testScheduler);
            res.json(health);
        } catch (error) {
            res.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                message: 'Quick health check failed'
            });
        }
    });

    // Detailed system metrics
    router.get('/metrics', async (req: Request, res: Response) => {
        try {
            const metrics = healthChecker.getSystemMetrics();
            const [diskSpace, network] = await Promise.all([
                healthChecker.checkDiskSpace(),
                healthChecker.checkNetworkConnectivity()
            ]);

            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                metrics: {
                    ...metrics,
                    diskSpace,
                    network
                }
            });
        } catch (error: any) {
            await errorHandler.logError(error, { endpoint: '/api/health/metrics' });
            res.status(500).json(errorHandler.formatApiError(error, {
                endpoint: '/api/health/metrics'
            }));
        }
    });

    // Readiness probe (Kubernetes/Docker için)
    router.get('/ready', async (req: Request, res: Response) => {
        try {
            const [fileSystem, testRunner] = await Promise.all([
                healthChecker.checkFileSystem(),
                healthChecker.checkTestRunner()
            ]);

            // Critical checks must be ok for readiness
            const isReady = fileSystem.status === 'ok' && testRunner.status === 'ok';

            if (isReady) {
                res.json({
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    checks: {
                        fileSystem: fileSystem.status,
                        testRunner: testRunner.status
                    }
                });
            } else {
                res.status(503).json({
                    status: 'not ready',
                    timestamp: new Date().toISOString(),
                    checks: {
                        fileSystem: fileSystem.status,
                        testRunner: testRunner.status
                    },
                    issues: [
                        fileSystem.status !== 'ok' && `FileSystem: ${fileSystem.error || 'Unknown error'}`,
                        testRunner.status !== 'ok' && `TestRunner: ${testRunner.error || testRunner.message}`
                    ].filter(Boolean)
                });
            }
        } catch (error: any) {
            await errorHandler.logError(error, { endpoint: '/api/health/ready' });
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: errorHandler.createSafeErrorMessage(error)
            });
        }
    });

    // Liveness probe (Kubernetes/Docker için)
    router.get('/live', (req: Request, res: Response) => {
        // Liveness check: server is running and responding
        res.json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime())
        });
    });

    return router;
}

export default createHealthRoutes;
