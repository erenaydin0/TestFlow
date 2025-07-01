export interface Test {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending' | 'running';
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  suite: string;
}

export interface TestStep {
  id: string;
  type: 'navigate' | 'click' | 'input' | 'wait' | 'refresh' | 'if';
  x: number;
  y: number;
  url?: string;
  selector?: string;
  value?: string;
  duration?: number;
  condition?: string;
  description?: string;
}

export interface ScheduledTest {
  id: string;
  testId: string;
  testName: string;
  schedule: string; // cron expression
  nextRun: Date;
  lastRun?: Date;
  status: 'active' | 'paused' | 'disabled';
  createdAt: Date;
}

export interface TestReport {
  id: string;
  testId: string;
  testName: string;
  status: 'passed' | 'failed';
  duration: number;
  startTime: Date;
  endTime: Date;
  errorMessage?: string;
  screenshots: string[];
  logs: string[];
}

export interface DashboardStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pendingTests: number;
  runningTests: number;
  scheduledTests: number;
  lastRunTime: Date;
  successRate: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  active?: boolean;
} 