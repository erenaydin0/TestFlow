import { BaseEntity } from './types';
import { BrowserType } from './browser';
import { ExecutionStatus, StepStatus } from './types';
import { Execution as SharedExecution, ExecutionOptions as SharedExecutionOptions, TestStep as SharedTestStep } from '@shared/types/index';

export interface ExecutionResult extends Omit<SharedExecution, 'steps' | 'options'> {
  // Frontend specific overrides or additions if any
  options: ExecutionOptions;
  steps: ExecutionStepResult[];
}

export interface ExecutionStepResult extends Omit<SharedTestStep, 'config'> {
  // Frontend specific overrides
  config: any;
}

export interface ExecutionOptions extends SharedExecutionOptions {
  browserType?: BrowserType; // Override to use frontend BrowserType enum/type if different
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
