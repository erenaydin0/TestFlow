import { BaseEntity, BaseStats } from './types';
import { BrowserType } from './browser';
import { ExecutionStatus, StepStatus } from './types';

export interface ExecutionResult extends BaseEntity {
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
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
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  config: any;
  error?: string;
  screenshot?: string;
  conditionResult?: boolean; // IF adımları için koşul sonucu
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
