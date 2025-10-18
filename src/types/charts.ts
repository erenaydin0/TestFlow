// Chart and dashboard specific types
import { TestStatus } from './types';

export interface DailyResult {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

export interface DailyTestResultsProps {
  data: DailyResult[];
}

export interface TestSuite {
  name: string;
  value: number;
  color: string;
}

export interface BrowserDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TestSuiteDistributionProps {
  testSuiteData: TestSuite[];
  browserData: BrowserDistribution[];
}

export interface RecentTest {
  id: number;
  executionId?: string;
  name: string;
  status: TestStatus;
  duration: number;
  lastRun: Date;
  environment: string;
}

export interface RecentTestsProps {
  data: RecentTest[];
}

export interface StatsCardsProps {
  stats: {
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    avgDuration: number;
    successRate: number;
  };
  loading?: boolean;
}
