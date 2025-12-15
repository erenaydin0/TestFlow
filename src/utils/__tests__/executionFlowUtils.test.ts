import { describe, it, expect } from 'vitest';
import {
  calculateFlowMetrics,
  analyzeExecutionSuccess,
} from '../executionFlowUtils';
import { ExecutionResult, ExecutionStepResult } from '@/types';

describe('executionFlowUtils', () => {
  const createMockExecution = (steps: Partial<ExecutionStepResult>[]): ExecutionResult => ({
    id: 'exec-1',
    workflowId: 'workflow-1',
    workflowName: 'Test Workflow',
    status: 'completed',
    startTime: new Date('2024-01-01'),
    progress: 100,
    options: {
      enableScreenshots: false,
      enableRecording: false,
      headlessMode: true,
      browserType: 'chromium',
    },
    steps: steps.map((step, index) => {
      const stepObj: any = {
        stepId: `step-${index + 1}`,
        type: step.type || 'navigate',
        status: step.status || 'passed',
        config: step.config || {},
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-01'),
      };
      // Only add duration if it's explicitly provided (including 0)
      if (step.duration !== undefined) {
        stepObj.duration = step.duration;
      }
      return stepObj;
    }),
    screenshots: [],
    logs: [],
    successRate: 100,
  });

  // getExecutionPath and getConditionResults tests removed - functions no longer exist
  // These functions were unused in production code

  describe('calculateFlowMetrics', () => {
    it('should calculate metrics correctly', () => {
      const execution = createMockExecution([
        { type: 'navigate', duration: 1000, status: 'passed' },
        { type: 'click', duration: 500, status: 'passed' },
        { type: 'input', duration: 2000, status: 'passed' },
      ]);

      const metrics = calculateFlowMetrics(execution);
      expect(metrics.totalSteps).toBe(3);
      expect(metrics.executedSteps).toBe(3);
      expect(metrics.executionRate).toBe(100);
      expect(metrics.avgStepDuration).toBeGreaterThan(0);
      expect(metrics.maxStepDuration).toBe(2000);
    });

    it('should handle pending steps', () => {
      const execution = createMockExecution([
        { type: 'navigate', duration: 1000, status: 'passed' },
        { type: 'click', status: 'pending' },
      ]);

      const metrics = calculateFlowMetrics(execution);
      expect(metrics.executedSteps).toBe(1);
      expect(metrics.executionRate).toBe(50);
    });

    it('should handle steps without duration', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'passed', duration: undefined }, // No duration
        { type: 'click', duration: 500, status: 'passed' },
      ]);

      const metrics = calculateFlowMetrics(execution);
      // Only step with duration should be counted (duration: 0 is falsy but still a number)
      // The function filters out steps without duration property
      expect(metrics.avgStepDuration).toBe(500);
    });

    it('should handle empty execution', () => {
      const execution = createMockExecution([]);
      const metrics = calculateFlowMetrics(execution);
      expect(metrics.totalSteps).toBe(0);
      expect(metrics.executedSteps).toBe(0);
      expect(metrics.executionRate).toBe(0);
    });
  });

  describe('analyzeExecutionSuccess', () => {
    it('should analyze successful execution', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'passed' },
        { type: 'click', status: 'passed' },
      ]);
      execution.status = 'completed';
      execution.successRate = 100;

      const analysis = analyzeExecutionSuccess(execution);
      expect(analysis.overallSuccess).toBe(true);
      expect(analysis.hasCriticalFailure).toBe(false);
      expect(analysis.totalFailures).toBe(0);
      expect(analysis.totalPassed).toBe(2);
      expect(analysis.successRate).toBe(100);
    });

    it('should detect critical failures', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'failed' },
        { type: 'click', status: 'passed' },
      ]);
      execution.status = 'failed';

      const analysis = analyzeExecutionSuccess(execution);
      expect(analysis.hasCriticalFailure).toBe(true);
      expect(analysis.criticalFailureCount).toBe(1);
      expect(analysis.totalFailures).toBe(1);
    });

    it('should identify non-critical failures', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'passed' },
        { type: 'wait', status: 'failed' },
      ]);
      execution.status = 'failed';

      const analysis = analyzeExecutionSuccess(execution);
      expect(analysis.hasCriticalFailure).toBe(false);
      expect(analysis.hasNonCriticalFailure).toBe(true);
      expect(analysis.nonCriticalFailureCount).toBe(1);
    });

    it('should generate recommendations', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'failed' },
        { type: 'verify', status: 'failed' },
      ]);
      execution.status = 'failed';

      const analysis = analyzeExecutionSuccess(execution);
      expect(analysis.recommendations).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('should handle mixed success and failure', () => {
      const execution = createMockExecution([
        { type: 'navigate', status: 'passed' },
        { type: 'click', status: 'failed' },
        { type: 'input', status: 'passed' },
      ]);
      execution.status = 'failed';
      execution.successRate = 66;

      const analysis = analyzeExecutionSuccess(execution);
      expect(analysis.totalPassed).toBe(2);
      expect(analysis.totalFailures).toBe(1);
      expect(analysis.successRate).toBe(66);
    });
  });
});

