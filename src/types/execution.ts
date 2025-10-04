import { BaseEntity, BaseStats } from './base';
import { BrowserType } from './test';

export interface ExecutionResult extends BaseEntity {
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  options: ExecutionOptions;
  steps: ExecutionStepResult[];
  screenshots: string[];
  logs: string[];
  videoPath?: string;
  successRate?: number;
  error?: string;
  suite?: string;
  tags?: string[];
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

export interface ExecutionOptions {
  enableScreenshots: boolean;
  enableRecording: boolean;
  headlessMode: boolean;
  browserType?: BrowserType;
}

export interface ExecutionStats {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  avgDuration: number;
  successRate: number;
}

export interface ExecutionFilters {
  search: string;
  status?: string;
  dateRange?: string;
  suite: string[];
  tags: string[];
  browserType: BrowserType[];
}
