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
  
  // Kaydedilen workflow'lar için ek alanlar
  workflow?: TestStep[]; // Saved workflow'lar için test adımları
  isExecutable?: boolean; // Bu workflow çalıştırılabilir mi?
  
  // Yeni seçenekler
  enableScreenshots?: boolean; // Ekran görüntüsü alma durumu
  enableRecording?: boolean; // Ekran kaydı alma durumu
}

export interface TestStep {
  id: string;
  type: string; // Made flexible to support any action type
  x: number;
  y: number;
  
  // Common properties
  description?: string;
  
  // Navigation properties
  url?: string;
  
  // Interaction properties
  selector?: string;
  
  // Input properties
  value?: string;
  
  // Timing properties
  duration?: number;
  
  // Condition properties
  condition?: string;
  
  // Validation properties
  expectedValue?: string;
  
  // Scroll properties
  direction?: 'top' | 'bottom' | 'left' | 'right';
  amount?: number;
  
  // Screenshot properties
  filename?: string;
  
  // Key press properties
  key?: string;
  
  // Connection properties
  connections?: string[]; // Array of connected step IDs (for regular steps)
  trueConnection?: string; // If step true branch
  falseConnection?: string; // If step false branch
  
  // Extensible properties for custom actions
  [key: string]: any;
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

// Workflow export/import interfaces
export interface WorkflowExport {
  version: string;
  name: string;
  description?: string;
  createdAt: string;
  steps: TestStep[];
  metadata?: {
    author?: string;
    tags?: string[];
    category?: string;
  };
} 