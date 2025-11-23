'use client';

import { ExecutionResult } from '@/types';

/**
 * Execution flow utilities for linear workflow execution
 * 
 * In linear flow, all steps execute sequentially without conditional branching.
 */

/**
 * Get execution path - in linear flow, all steps are in the path
 * @param execution ExecutionResult object
 * @returns Array of step IDs in execution order
 */
export const getExecutionPath = (execution: ExecutionResult): string[] => {
  // In linear flow, all steps are executed sequentially
  return execution.steps.map(step => step.stepId);
};

/**
 * Get condition results - no longer applicable in linear flow
 * @returns Empty map (no IF steps in linear flow)
 */
export const getConditionResults = (): Map<string, boolean> => {
  // No IF steps or conditional branching in linear flow
  return new Map();
};

/**
 * Calculate basic execution metrics for linear flow
 */
export const calculateFlowMetrics = (execution: ExecutionResult) => {
  const totalSteps = execution.steps.length;
  const executedSteps = execution.steps.filter(s => s.status !== 'pending').length;

  const avgStepDuration = execution.steps
    .filter(step => step.duration)
    .reduce((sum, step) => sum + (step.duration || 0), 0) /
    execution.steps.filter(step => step.duration).length || 0;

  const maxStepDuration = Math.max(
    ...execution.steps
      .filter(step => step.duration)
      .map(step => step.duration || 0),
    0
  );

  return {
    totalSteps,
    executedSteps,
    executionRate: totalSteps > 0 ? (executedSteps / totalSteps) * 100 : 0,
    avgStepDuration: Math.round(avgStepDuration),
    maxStepDuration
  };
};

/**
 * Analyze execution success for linear flow
 */
export const analyzeExecutionSuccess = (execution: ExecutionResult) => {
  const metrics = calculateFlowMetrics(execution);

  const failedSteps = execution.steps.filter(step => step.status === 'failed');
  const passedSteps = execution.steps.filter(step => step.status === 'passed');

  // Critical action types that indicate important failures
  const criticalFailures = failedSteps.filter(step =>
    ['navigate', 'click', 'input', 'verify'].includes(step.type)
  );

  const hasCriticalFailure = criticalFailures.length > 0;
  const hasNonCriticalFailure = failedSteps.length > criticalFailures.length;

  return {
    overallSuccess: execution.status === 'completed',
    hasCriticalFailure,
    hasNonCriticalFailure,
    criticalFailureCount: criticalFailures.length,
    nonCriticalFailureCount: failedSteps.length - criticalFailures.length,
    totalFailures: failedSteps.length,
    totalPassed: passedSteps.length,
    successRate: execution.successRate || 0,
    executionQuality: metrics.executionRate,
    recommendations: generateRecommendations(metrics, hasCriticalFailure, criticalFailures)
  };
};

/**
 * Generate recommendations based on execution analysis
 */
const generateRecommendations = (
  metrics: any,
  hasCriticalFailure: boolean,
  criticalFailures: any[]
) => {
  const recommendations: string[] = [];

  if (hasCriticalFailure) {
    recommendations.push('Critical steps failed - review test scenario');
  }

  if (metrics.executionRate < 80) {
    recommendations.push('Low execution rate - some steps did not complete');
  }

  if (metrics.avgStepDuration > 5000) {
    recommendations.push('Long step durations - optimize selectors');
  }

  if (criticalFailures.some(f => f.type === 'verify')) {
    recommendations.push('Verification steps failed - check expected values');
  }

  return recommendations;
};
