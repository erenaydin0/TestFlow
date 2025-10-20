'use client';

import { useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import { 
  StatsCards,
  DailyTestResults, 
  TestSuiteDistribution, 
  RecentTests,
  UpcomingTests
} from '@/components/dashboard';
import { useExecutions, useScheduledTests } from '@/hooks';
import { getConsistentColorFromString } from '@/utils/utils';
import { useI18n } from '@/contexts';

export default function Dashboard() {
  const { executions, loading, error, stats, refresh } = useExecutions();
  const { scheduledTests, loading: scheduledLoading } = useScheduledTests();
  const { t } = useI18n();
  const [dateRange, setDateRange] = useState(14);

  // Process data for charts
  const chartData = useMemo(() => {
    // Daily results based on selected date range
    const days = Array.from({ length: dateRange }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyResults = days.map(date => {
      const dayExecutions = (executions || []).filter((e: any) => 
        new Date(e.startTime).toISOString().split('T')[0] === date
      );
      return {
        date,
        passed: dayExecutions.filter((e: any) => e.status === 'completed').length,
        failed: dayExecutions.filter((e: any) => e.status === 'failed').length,
        total: dayExecutions.length
      };
    });

    // Test suite distribution with success rate
    const testSuiteData = (executions || []).reduce((acc: any, execution: any) => {
      const suite = execution.suite || t('dashboard.other');
      if (!acc[suite]) {
        acc[suite] = { total: 0, passed: 0 };
      }
      acc[suite].total += 1;
      if (execution.status === 'completed') {
        acc[suite].passed += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number }>);

    // Her test grubu için tutarlı renk üret (aynı isim her zaman aynı rengi alır)
    const testSuiteDataWithColors = Object.entries(testSuiteData).map(([name, data]) => {
      const suiteData = data as { total: number; passed: number };
      return {
        name,
        value: suiteData.total,
        successRate: suiteData.total > 0 ? Math.round((suiteData.passed / suiteData.total) * 100) : 0,
        color: getConsistentColorFromString(name)
      };
    });

    // Browser distribution with success rate
    const browserData = (executions || []).reduce((acc: any, execution: any) => {
      const browser = execution.options?.browserType || 'chromium';
      if (!acc[browser]) {
        acc[browser] = { total: 0, passed: 0 };
      }
      acc[browser].total += 1;
      if (execution.status === 'completed') {
        acc[browser].passed += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number }>);

    // Her tarayıcı için tutarlı renk üret
    const browserDataWithColors = Object.entries(browserData).map(([browserType, data]) => {
      const browserStats = data as { total: number; passed: number };
      const displayName = browserType === 'chromium' ? 'Chrome' : 
                          browserType === 'firefox' ? 'Firefox' : 
                          browserType === 'webkit' ? 'Safari' : browserType;
      return {
        name: displayName,
        browserType: browserType, // Gerçek browser type'ı sakla
        value: browserStats.total,
        successRate: browserStats.total > 0 ? Math.round((browserStats.passed / browserStats.total) * 100) : 0,
        color: getConsistentColorFromString(browserType)
      };
    });

    // Recent tests (last 5) - map to RecentTest interface
    const recentTests = (executions || [])
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5)
      .map((execution: any, index: number) => ({
        id: index,
        executionId: execution.id,
        name: execution.workflowName,
        status: execution.status === 'completed' ? 'passed' as const : 
                execution.status === 'failed' ? 'failed' as const : 'running' as const,
        duration: execution.duration || 0,
        lastRun: new Date(execution.startTime),
        environment: execution.suite || t('dashboard.default')
      }));

    return {
      dailyResults,
      testSuiteData: testSuiteDataWithColors,
      browserData: browserDataWithColors,
      recentTests
    };
  }, [executions, dateRange]);

  return (
    <PageLayout title={t('dashboard.title')}>
      <LoadingErrorState 
        loading={loading} 
        error={error} 
        loadingMessage={t('dashboard.loadingData')}
        onRetry={refresh}
      >
        <StatsCards stats={stats} loading={loading} />
        {/* İlk satır: Günlük Test Sonuçları + Son Testler */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-8">
            <DailyTestResults 
              data={chartData.dailyResults} 
              onDateRangeChange={setDateRange}
            />
          </div>
          <div className="lg:col-span-4">
            <RecentTests data={chartData.recentTests} />
          </div>
        </div>
        
        {/* İkinci satır: Son Testler altında Yaklaşan Testler */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-8">
            <TestSuiteDistribution 
              testSuiteData={chartData.testSuiteData} 
              browserData={chartData.browserData}
            />
          </div>
          <div className="lg:col-span-4">
            <UpcomingTests 
              scheduledTests={scheduledTests}
              loading={scheduledLoading}
              maxItems={5}
              showViewAll={true}
            />
          </div>
        </div>
      </LoadingErrorState>
    </PageLayout>
  );
} 