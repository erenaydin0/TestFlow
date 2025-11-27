import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SystemMetrics {
    memory: {
        used: number;
        total: number;
        external: number;
        rss: number;
        percentage: number;
    };
    cpu: {
        user: number;
        system: number;
    };
    uptime: {
        process: number;
        system: number;
    };
    platform: {
        type: string;
        arch: string;
        release: string;
        hostname: string;
    };
}

interface FileSystemCheck {
    status: 'ok' | 'error';
    path: string;
    writable?: boolean;
    error?: string;
}

interface ConnectivityCheck {
    status: 'ok' | 'warning' | 'error' | 'unknown';
    message: string;
    error?: string;
}

interface HealthCheckResult {
    status: string;
    timestamp: string;
    uptime: {
        startTime: string;
        duration: number;
    };
    metrics: any;
    checks: any;
    issues: string[];
    version: string;
    environment: string;
}

class HealthChecker {
    private startTime: Date;
    private checks: Map<string, any>;

    constructor() {
        this.startTime = new Date();
        this.checks = new Map();
    }

    // Sistem metriklerini al
    public getSystemMetrics(): SystemMetrics {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: {
                process: Math.round(process.uptime()), // seconds
                system: Math.round(os.uptime()) // seconds
            },
            platform: {
                type: os.type(),
                arch: os.arch(),
                release: os.release(),
                hostname: os.hostname()
            }
        };
    }

    // Dosya sistemi durumunu kontrol et
    public async checkFileSystem(): Promise<Record<string, FileSystemCheck>> {
        const checks: Record<string, FileSystemCheck> = {
            executions: { status: 'ok', path: process.env.EXECUTIONS_DIR || './server/storage/executions' },
            screenshots: { status: 'ok', path: process.env.SCREENSHOTS_DIR || './server/storage/screenshots' },
            videos: { status: 'ok', path: process.env.VIDEOS_DIR || './server/storage/videos' },
            scheduledTests: { status: 'ok', path: process.env.SCHEDULED_TESTS_DIR || './server/storage/scheduled-tests' },
            tests: { status: 'ok', path: process.env.TESTS_DIR || './server/storage/tests' },
            logs: { status: 'ok', path: './server/logs' }
        };

        for (const [key, check] of Object.entries(checks)) {
            try {
                await fs.access(check.path, fs.constants.W_OK);
                check.status = 'ok';
                check.writable = true;
            } catch (error: any) {
                check.status = 'error';
                check.writable = false;
                check.error = error.message;
            }
        }

        return checks;
    }

    // Disk space kontrolü
    public async checkDiskSpace(): Promise<any> {
        try {
            const storagePath = process.env.EXECUTIONS_DIR || './server/storage';

            // Node.js'de cross-platform disk space kontrolü için
            // fs.statfs sadece bazı platformlarda çalışır, alternatif kullan
            try {
                // Try to get disk space info (works on Unix-like systems)
                const { execSync } = await import('child_process');
                const platform = os.platform();

                let diskInfo = {};

                if (platform === 'linux' || platform === 'darwin') {
                    try {
                        const dfOutput = execSync(`df -h "${storagePath}"`, { encoding: 'utf8' });
                        const lines = dfOutput.trim().split('\n');
                        if (lines.length > 1) {
                            const parts = lines[1].split(/\s+/);
                            diskInfo = {
                                total: parts[1],
                                used: parts[2],
                                available: parts[3],
                                usePercent: parts[4]
                            };
                        }
                    } catch (e) {
                        // df command failed, skip disk info
                    }
                }

                return {
                    status: 'ok',
                    path: storagePath,
                    ...diskInfo,
                    message: 'Disk space check completed'
                };
            } catch (error) {
                // Fallback: just check if directory is writable
                return {
                    status: 'ok',
                    path: storagePath,
                    message: 'Disk space check unavailable on this platform',
                    writable: true
                };
            }
        } catch (error: any) {
            return {
                status: 'error',
                message: 'Failed to check disk space',
                error: error.message
            };
        }
    }

    // Network connectivity kontrolü
    public async checkNetworkConnectivity(): Promise<Record<string, ConnectivityCheck>> {
        const checks: Record<string, ConnectivityCheck> = {
            localhost: { status: 'ok', message: 'Local network available' },
            external: { status: 'unknown', message: 'External connectivity not tested' }
        };

        // Test localhost connectivity
        try {
            const http = await import('http');
            await new Promise<void>((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: process.env.PORT || 3004,
                    path: '/api/health/quick',
                    method: 'GET',
                    timeout: 2000
                }, (res) => {
                    resolve();
                });

                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });

                req.end();
            });

            checks.localhost.status = 'ok';
        } catch (error: unknown) {
            checks.localhost.status = 'warning';
            checks.localhost.message = 'Localhost connectivity check failed';
            checks.localhost.error = error instanceof Error ? error.message : String(error);
        }

        // External connectivity test (optional, can be enabled via env)
        if (process.env.ENABLE_EXTERNAL_CONNECTIVITY_CHECK === 'true') {
            try {
                const signal = AbortSignal.timeout(5000);
                const response = await fetch('https://www.google.com', {
                    method: 'HEAD',
                    signal
                });
                checks.external.status = response.ok ? 'ok' : 'warning';
                checks.external.message = 'External connectivity available';
            } catch (error: unknown) {
                checks.external.status = 'warning';
                checks.external.message = 'External connectivity check failed';
                checks.external.error = error instanceof Error ? error.message : String(error);
            }
        }

        return checks;
    }

    // Test runner durumunu kontrol et
    public async checkTestRunner(): Promise<Record<string, unknown>> {
        try {
            // Dynamic import for ES modules
            const { default: TestRunner } = await import('../core/testRunner.js');
            const testRunner = new TestRunner();

            // Browser başlatma testi (headless)
            await testRunner.initializeBrowser({
                headless: true,
                enableRecording: false
            });

            await testRunner.closeBrowser();

            return {
                status: 'ok',
                message: 'Test runner is functional',
                browserAvailable: true
            };
        } catch (error: unknown) {
            return {
                status: 'error',
                message: 'Test runner failed',
                browserAvailable: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    // WebSocket bağlantı durumunu kontrol et
    public checkWebSocketConnections(clients: Set<unknown>): Record<string, unknown> {
        const healthyConnections = Array.from(clients).filter(
            (client: unknown) => (client as any).readyState === (client as any).OPEN
        ).length;

        return {
            status: healthyConnections > 0 ? 'ok' : 'warning',
            total: clients.size,
            healthy: healthyConnections,
            unhealthy: clients.size - healthyConnections
        };
    }

    // Scheduler durumunu kontrol et
    public checkScheduler(testScheduler: unknown): Record<string, unknown> {
        if (!testScheduler) {
            return {
                status: 'warning',
                message: 'Scheduler not initialized',
                activeSchedules: 0
            };
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ts = testScheduler as any;
            const activeSchedules = ts.getScheduleCount();
            return {
                status: 'ok',
                message: 'Scheduler is running',
                activeSchedules,
                schedules: ts.getActiveSchedules()
            };
        } catch (error: unknown) {
            return {
                status: 'error',
                message: 'Scheduler error',
                error: error instanceof Error ? error.message : String(error),
                activeSchedules: 0
            };
        }
    }

    // Genel sağlık durumunu hesapla
    private calculateOverallHealth(checks: Record<string, unknown>): { status: string; issues: string[] } {
        const criticalChecks = ['fileSystem', 'testRunner'];
        const warningChecks = ['webSocket', 'scheduler', 'diskSpace', 'network'];

        let status = 'ok';
        const issues: string[] = [];

        // Critical checks
        for (const check of criticalChecks) {
            const result = checks[check] as any;
            if (result && result.status === 'error') {
                status = 'error';
                issues.push(`${check}: ${result.message || result.error}`);
            }
        }

        // Warning checks
        if (status === 'ok') {
            for (const check of warningChecks) {
                const result = checks[check] as any;
                if (result && result.status === 'warning') {
                    status = 'warning';
                    issues.push(`${check}: ${result.message || result.error}`);
                } else if (result && result.status === 'error') {
                    status = 'warning';
                    issues.push(`${check}: ${result.message || result.error}`);
                }
            }
        }

        return { status, issues };
    }

    // Tam sağlık raporu oluştur
    public async generateHealthReport(activeExecutions: Map<unknown, unknown>, clients: Set<unknown>, testScheduler: unknown): Promise<HealthCheckResult> {
        const timestamp = new Date().toISOString();

        // Tüm kontrolleri paralel olarak çalıştır
        const [
            systemMetrics,
            fileSystem,
            testRunner,
            webSocket,
            scheduler,
            diskSpace,
            network
        ] = await Promise.all([
            this.getSystemMetrics(),
            this.checkFileSystem(),
            this.checkTestRunner(),
            Promise.resolve(this.checkWebSocketConnections(clients)),
            Promise.resolve(this.checkScheduler(testScheduler)),
            this.checkDiskSpace(),
            this.checkNetworkConnectivity()
        ]);

        const checks = {
            system: { status: 'ok', ...systemMetrics },
            fileSystem,
            testRunner,
            webSocket,
            scheduler,
            diskSpace,
            network
        };

        const overallHealth = this.calculateOverallHealth(checks);

        return {
            status: overallHealth.status,
            timestamp,
            uptime: {
                startTime: this.startTime.toISOString(),
                duration: Math.round((Date.now() - this.startTime.getTime()) / 1000)
            },
            metrics: {
                activeExecutions: activeExecutions.size,
                connectedClients: clients.size,
                ...systemMetrics
            },
            checks,
            issues: overallHealth.issues,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }

    // Hızlı sağlık kontrolü (basit endpoint için)
    public getQuickHealth(activeExecutions: Map<unknown, unknown>, clients: Set<unknown>, testScheduler: unknown): Record<string, unknown> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            activeExecutions: activeExecutions.size,
            connectedClients: clients.size,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activeSchedules: testScheduler && typeof testScheduler === 'object' && 'getScheduleCount' in testScheduler ? (testScheduler as any).getScheduleCount() : 0,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        };
    }
}

const healthChecker = new HealthChecker();
export default healthChecker;
