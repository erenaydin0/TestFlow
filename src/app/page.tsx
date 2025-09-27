'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import { 
  DailyTestResults, 
  TestSuiteDistribution, 
  RecentTests
} from '@/components/dashboard';
import { ExecutionResult } from '@/types';
import { useSidebar } from '@/lib/sidebar-context';

export default function Dashboard() {
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isCollapsed } = useSidebar();

  // Fetch executions from backend
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/executions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExecutions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching executions:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalExecutions: executions.length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      avgDuration: executions.length > 0 ? 
        Math.round(executions.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / executions.filter(e => e.duration).length) : 0,
      successRate: executions.length > 0 ? 
        Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100) : 0
    };
  }, [executions]);

  // Process data for charts
  const chartData = useMemo(() => {
    // Daily results from last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyResults = last7Days.map(date => {
      const dayExecutions = executions.filter(e => 
        new Date(e.startTime).toISOString().split('T')[0] === date
      );
      return {
        date,
        passed: dayExecutions.filter(e => e.status === 'completed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length,
        total: dayExecutions.length
      };
    });

    // Test suite distribution
    const testSuiteData = executions.reduce((acc, execution) => {
      const suite = execution.suite || 'Diğer';
      acc[suite] = (acc[suite] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Colors for test suites
    const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'];
    
    const testSuiteDataWithColors = Object.entries(testSuiteData).map(([name, value], index) => ({
      name, 
      value,
      color: colors[index % colors.length]
    }));

    // Browser distribution
    const browserData = executions.reduce((acc, execution) => {
      const browser = execution.options?.browserType || 'chromium';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserColors = ['#4285f4', '#ff6d01', '#9333ea', '#059669', '#dc2626'];
    const browserDataWithColors = Object.entries(browserData).map(([name, value], index) => ({
      name: name === 'chromium' ? 'Chrome' : 
            name === 'firefox' ? 'Firefox' : 
            name === 'webkit' ? 'Safari' : name,
      value,
      color: browserColors[index % browserColors.length]
    }));

    // Recent tests (last 5) - map to RecentTest interface
    const recentTests = executions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5)
      .map((execution, index) => ({
        id: index,
        executionId: execution.id,
        name: execution.workflowName,
        status: execution.status === 'completed' ? 'passed' as const : 
                execution.status === 'failed' ? 'failed' as const : 'running' as const,
        duration: execution.duration || 0,
        lastRun: new Date(execution.startTime),
        environment: execution.suite || 'Default'
      }));

    return {
      dailyResults,
      testSuiteData: testSuiteDataWithColors,
      browserData: browserDataWithColors,
      recentTests
    };
  }, [executions]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div 
        className="flex-1 pt-16" 
        style={{ 
          marginLeft: isCollapsed ? '4rem' : '16rem',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <Header />
        
        <main className="p-6">
          <StatsCards stats={stats} loading={loading} />
          
          {error ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
              Veriler yüklenirken hata oluştu: {error}
            </div>
          ) : (
            <>
              {/* İlk satır: Günlük Test Sonuçları + Son Testler */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className="lg:col-span-8">
                  <DailyTestResults data={chartData.dailyResults} />
                </div>
                <div className="lg:col-span-4">
                  <RecentTests data={chartData.recentTests} />
                </div>
              </div>
              {/* İkinci satır: Test Dağılımı + Hata Türleri */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <TestSuiteDistribution 
                  testSuiteData={chartData.testSuiteData} 
                  browserData={chartData.browserData}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
} 