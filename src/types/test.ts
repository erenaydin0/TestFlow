import { BaseEntity, BaseFormData } from './base';

export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'msedge';

export interface Test extends BaseEntity {
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending' | 'running';
  duration: number;
  tags: string[];
  suite: string;
  
  // Workflow properties
  workflow?: TestStep[];
  isExecutable?: boolean;
  
  // Browser and execution options
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
  browserType?: BrowserType;
}

export interface TestStep {
  id: string;
  type: string;
  x: number;
  y: number;
  
  // Common properties
  description?: string;
  
  // Navigation properties
  url?: string;
  
  // Interaction properties
  selector?: string;
  value?: string;
  
  // Timing properties
  duration?: number;
  
  // Condition properties
  condition?: string;
  conditionType?: 'exists' | 'visible' | 'hidden' | 'text' | 'textContains' | 'value' | 'valueContains' | 'count' | 'url' | 'urlContains';
  expectedValue?: string;
  operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual';
  
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
  verificationType?: 'text' | 'contains' | 'value' | 'visible' | 'hidden' | 'enabled' | 'disabled' | 'url' | 'urlContains';
  
  // Connection properties
  connections?: string[];
  trueConnection?: string;
  falseConnection?: string;
  
  // Extensible properties
  [key: string]: any;
}

export interface TestFormData extends BaseFormData {
  name: string;
  description: string;
  tags: string[];
  suite: string;
  browserType: BrowserType;
}

export interface TestFilters {
  search: string;
  suite: string[];
  tags: string[];
  browserType: BrowserType[];
}

export interface TestStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  avgDuration: number;
  successRate: number;
}
