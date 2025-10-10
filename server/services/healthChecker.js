const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class HealthChecker {
  constructor() {
    this.startTime = new Date();
    this.checks = new Map();
  }

  // Sistem metriklerini al
  getSystemMetrics() {
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
  async checkFileSystem() {
    const checks = {
      executions: { status: 'ok', path: process.env.EXECUTIONS_DIR || './server/executions' },
      screenshots: { status: 'ok', path: process.env.SCREENSHOTS_DIR || './server/screenshots' },
      videos: { status: 'ok', path: process.env.VIDEOS_DIR || './server/videos' },
      scheduledTests: { status: 'ok', path: process.env.SCHEDULED_TESTS_DIR || './server/scheduled-tests' },
      tests: { status: 'ok', path: process.env.TESTS_DIR || './server/tests' },
      logs: { status: 'ok', path: './server/logs' }
    };

    for (const [key, check] of Object.entries(checks)) {
      try {
        await fs.access(check.path, fs.constants.W_OK);
        check.status = 'ok';
        check.writable = true;
      } catch (error) {
        check.status = 'error';
        check.writable = false;
        check.error = error.message;
      }
    }

    return checks;
  }

  // Test runner durumunu kontrol et
  async checkTestRunner() {
    try {
      const TestRunner = require('../testRunner');
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
    } catch (error) {
      return {
        status: 'error',
        message: 'Test runner failed',
        browserAvailable: false,
        error: error.message
      };
    }
  }

  // WebSocket bağlantı durumunu kontrol et
  checkWebSocketConnections(clients) {
    const healthyConnections = Array.from(clients).filter(
      client => client.readyState === client.OPEN
    ).length;

    return {
      status: healthyConnections > 0 ? 'ok' : 'warning',
      total: clients.size,
      healthy: healthyConnections,
      unhealthy: clients.size - healthyConnections
    };
  }

  // Scheduler durumunu kontrol et
  checkScheduler(testScheduler) {
    if (!testScheduler) {
      return {
        status: 'warning',
        message: 'Scheduler not initialized',
        activeSchedules: 0
      };
    }

    try {
      const activeSchedules = testScheduler.getScheduleCount();
      return {
        status: 'ok',
        message: 'Scheduler is running',
        activeSchedules,
        schedules: testScheduler.getActiveSchedules()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Scheduler error',
        error: error.message,
        activeSchedules: 0
      };
    }
  }

  // Genel sağlık durumunu hesapla
  calculateOverallHealth(checks) {
    const criticalChecks = ['fileSystem', 'testRunner'];
    const warningChecks = ['webSocket', 'scheduler'];
    
    let status = 'ok';
    let issues = [];

    // Critical checks
    for (const check of criticalChecks) {
      if (checks[check] && checks[check].status === 'error') {
        status = 'error';
        issues.push(`${check}: ${checks[check].message}`);
      }
    }

    // Warning checks
    if (status === 'ok') {
      for (const check of warningChecks) {
        if (checks[check] && checks[check].status === 'warning') {
          status = 'warning';
          issues.push(`${check}: ${checks[check].message}`);
        }
      }
    }

    return { status, issues };
  }

  // Tam sağlık raporu oluştur
  async generateHealthReport(activeExecutions, clients, testScheduler) {
    const timestamp = new Date().toISOString();
    
    // Tüm kontrolleri paralel olarak çalıştır
    const [
      systemMetrics,
      fileSystem,
      testRunner,
      webSocket,
      scheduler
    ] = await Promise.all([
      this.getSystemMetrics(),
      this.checkFileSystem(),
      this.checkTestRunner(),
      Promise.resolve(this.checkWebSocketConnections(clients)),
      Promise.resolve(this.checkScheduler(testScheduler))
    ]);

    const checks = {
      system: { status: 'ok', ...systemMetrics },
      fileSystem,
      testRunner,
      webSocket,
      scheduler
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
  getQuickHealth(activeExecutions, clients, testScheduler) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      activeExecutions: activeExecutions.size,
      connectedClients: clients.size,
      activeSchedules: testScheduler ? testScheduler.getScheduleCount() : 0,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    };
  }
}

module.exports = new HealthChecker();
