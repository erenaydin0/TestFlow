'use client';

import { Test, BrowserType } from '@/types';
import { ExecutionService } from '@/utils/api';

export interface TestExecutionOptions {
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
  browserType?: BrowserType;
}

export interface BackendStep {
  id: string;
  type: string;
  config: {
    url?: string;
    selector?: string;
    value?: string;
    text?: string;
    target?: string;
    duration?: number;
    expectedValue?: string;
    verificationType?: string;
    optionType?: string;
    optionValue?: string;
  };
}

/**
 * Frontend test adımlarını backend formatına dönüştürür
 */
/**
 * Frontend test adımlarını backend formatına dönüştürür
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertStepsToBackendFormat = (workflow: any[]): BackendStep[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return workflow.map((step: any) => ({
    id: step.id,
    type: step.type,
    config: {
      type: step.type,
      url: step.url,
      selector: step.selector,
      value: step.value,
      text: step.value, // For type actions
      target: step.selector, // Alternative selector name
      duration: step.duration,
      expectedValue: step.expectedValue,
      verificationType: step.verificationType, // For verify actions
      optionType: step.optionType, // For dropdown actions
      optionValue: step.optionValue // For dropdown actions
    }
  }));
};

/**
 * Tek bir test çalıştırır
 */
export const executeTest = async (
  test: Test,
  options: TestExecutionOptions = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  browserSettings: any
) => {
  if (!test.workflow || test.workflow.length === 0) {
    throw new Error('Test workflow not found');
  }

  const backendSteps = convertStepsToBackendFormat(test.workflow);

  const data = await ExecutionService.executeWorkflow({
    workflowId: test.id,
    workflowName: test.name,
    steps: backendSteps,
    suite: test.suite,
    tags: test.tags,
    options: {
      enableScreenshots: test.enableScreenshots !== undefined ? test.enableScreenshots : browserSettings.defaultScreenshots,
      enableRecording: test.enableRecording !== undefined ? test.enableRecording : browserSettings.defaultRecording,
      headlessMode: test.headlessMode !== undefined ? test.headlessMode : browserSettings.defaultHeadless,
      browserType: test.browserType !== undefined ? test.browserType : browserSettings.defaultBrowser,
      ...options
    }
  });

  return data;
};

/**
 * Toplu test çalıştırır
 */
export const executeBulkTests = async (
  tests: Test[],
  options: TestExecutionOptions = {}
) => {
  const validTests = tests.filter(test => test.workflow && test.workflow.length > 0);

  if (validTests.length === 0) {
    throw new Error('No valid workflows found');
  }

  const executionPromises = validTests.map(async (test) => {
    const backendSteps = convertStepsToBackendFormat(test.workflow!);

    return await ExecutionService.executeWorkflow({
      workflowId: test.id,
      workflowName: test.name,
      steps: backendSteps,
      suite: test.suite,
      tags: test.tags,
      options: {
        enableScreenshots: test.enableScreenshots || false,
        enableRecording: test.enableRecording || false,
        headlessMode: test.headlessMode || false,
        browserType: test.browserType || 'chromium',
        ...options
      }
    });
  });

  const results = await Promise.all(executionPromises);
  return results;
};

/**
 * Test çalıştırma için gerekli validasyonları yapar
 */
export const validateTestForExecution = (test: Test): { isValid: boolean; error?: string } => {
  if (!test.workflow || test.workflow.length === 0) {
    return { isValid: false, error: 'Test workflow not found' };
  }

  if (!test.name || test.name.trim() === '') {
    return { isValid: false, error: 'Test name is required' };
  }

  return { isValid: true };
};

/**
 * Test çalıştırma sonuçlarını işler
 */
/**
 * Test çalıştırma sonuçlarını işler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const processExecutionResults = (results: any[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executionIds = results.map((r: any) => r.executionId);
  const successCount = results.filter(r => r.executionId).length;
  const failureCount = results.length - successCount;

  return {
    executionIds,
    successCount,
    failureCount,
    totalCount: results.length
  };
};
