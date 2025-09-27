export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'msedge';

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
  headlessMode?: boolean; // Headless mod durumu
  browserType?: BrowserType; // Tarayıcı türü
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
  
  // Dropdown properties
  optionType?: 'value' | 'text' | 'index';
  optionValue?: string;
  
  // Verification properties
  verificationType?: 'text' | 'contains' | 'value' | 'visible' | 'hidden' | 'enabled' | 'disabled';
  
  // Connection properties
  connections?: string[]; // Array of connected step IDs (for regular steps)
  trueConnection?: string; // If step true branch
  falseConnection?: string; // If step false branch
  
  // Extensible properties for custom actions
  [key: string]: any;
}

// Yeni execution result interface'leri
export interface ExecutionResult {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  options: {
    enableScreenshots: boolean;
    enableRecording: boolean;
    headlessMode: boolean;
    browserType?: BrowserType;
  };
  steps: ExecutionStepResult[];
  screenshots: string[];
  logs: string[];
  videoPath?: string;
  successRate?: number;
  error?: string;
  suite?: string; // Test grubu
  tags?: string[]; // Etiketler
}

export interface ExecutionStepResult {
  stepId: string;
  type: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  config: any;
  error?: string;
  screenshot?: string;
}