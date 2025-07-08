'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  StatsCards, 
  DailyTestResults, 
  TestSuiteDistribution, 
  SuccessRateTrend, 
  ExecutionTimes, 
  RecentTests 
} from '@/components/dashboard';
import { 
  dailyResults, 
  getTestSuiteData, 
  successRateData, 
  executionTimeData, 
  recentTests 
} from '@/data/dashboardData';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div className="flex-1 ml-64 pt-16">
        <Header />
        
        <main className="p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <DailyTestResults data={dailyResults} />
            </div>
            <div>
              <TestSuiteDistribution data={getTestSuiteData()} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SuccessRateTrend data={successRateData} />
            <ExecutionTimes data={executionTimeData} />
            <RecentTests data={recentTests} />
          </div>
        </main>
      </div>
    </div>
  );
} 