/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ExecutionResult, Test } from '@/types';
import { API_URL } from '@/utils/config';
import { getBrowserName } from '@/types/browser';
import { downloadCSV } from '@/utils/fileUtils';

/**
 * Test listesi için CSV raporu oluşturur ve indirir
 */
export const exportTestsToCSV = (
  tests: Test[],
  t: (key: string, params?: any) => string
): void => {
  const csvHeaders = [
    t('tests.testName'),
    t('tests.description'),
    t('tests.testGroup'),
    t('tests.tags'),
    t('tests.browser'),
    t('tests.status'),
    t('tests.stepCount'),
    t('tests.screenshots'),
    t('tests.recording'),
    t('tests.headless'),
    t('tests.createdAt'),
    t('tests.updatedAt'),
    t('tests.testId')
  ];

  const csvRows = tests.map(test => [
    `"${test.name.replace(/"/g, '""')}"`,
    `"${test.description ? test.description.replace(/"/g, '""') : ''}"`,
    test.suite || '',
    `"${(test.tags || []).join(', ')}"`,
    getBrowserName(test.browserType),
    test.status || '',
    test.workflow ? test.workflow.length : 0,
    test.enableScreenshots ? t('common.yes') : t('common.no'),
    test.enableRecording ? t('common.yes') : t('common.no'),
    test.headlessMode ? t('common.yes') : t('common.no'),
    test.createdAt ? new Date(test.createdAt).toLocaleString('tr-TR') : '',
    test.updatedAt ? new Date(test.updatedAt).toLocaleString('tr-TR') : '',
    test.id
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const filename = `CosmicQA-tests-${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, filename);
};

/**
 * Execution listesi için CSV raporu oluşturur ve indirir
 */
export const exportExecutionsToCSV = (
  executions: ExecutionResult[],
  t: (key: string, params?: any) => string
): void => {
  const csvContent = createTestCSVReport(executions, t);
  const filename = `CosmicQA-executions-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Tek execution için adım detayları CSV raporu oluşturur ve indirir
 */
export const exportExecutionStepsToCSV = (
  execution: ExecutionResult,
  t: (key: string, params?: any) => string
): void => {
  const csvContent = createStepsCSVReport(execution, t);
  const filename = `${execution.workflowName}-steps-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Tek test execution için CSV raporu oluşturur
 */
export const createTestCSVReport = (
  executions: ExecutionResult[],
  t: (key: string, params?: any) => string
) => {
  const csvHeaders = [
    t('reports.testName'),
    t('reports.executionId'),
    t('reports.status'),
    t('reports.startTime'),
    t('reports.endTime'),
    t('reports.totalDuration'),
    t('reports.successRate'),
    t('reports.testGroup'),
    t('reports.tags'),
    t('reports.browser'),
    t('reports.totalSteps'),
    t('reports.passedSteps'),
    t('reports.failedSteps'),
    t('reports.videoAvailable'),
    t('reports.screenshotCount'),
    t('reports.firstStepType'),
    t('reports.lastStepType'),
    t('reports.firstError'),
    t('reports.lastStepDuration'),
    t('reports.averageStepDuration'),
    t('reports.longestStepDuration'),
    t('reports.reportingDate')
  ];

  const csvRows = executions.map(execution => {
    const stepDurations = execution.steps.filter(s => s.duration).map(s => s.duration!);
    const avgStepDuration = stepDurations.length > 0 ? Math.round(stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length) : 0;
    const maxStepDuration = stepDurations.length > 0 ? Math.max(...stepDurations) : 0;
    const firstError = execution.steps.find(s => s.error)?.error || '';
    const lastStepDuration = execution.steps[execution.steps.length - 1]?.duration || 0;

    return [
      execution.workflowName,
      execution.id,
      getTranslatedStatusText(execution.status, t),
      execution.startTime ? new Date(execution.startTime).toLocaleString('tr-TR') : '',
      execution.endTime ? new Date(execution.endTime).toLocaleString('tr-TR') : '',
      execution.duration || '',
      execution.successRate || '',
      execution.suite || '',
      (execution.tags || []).join(', '),
      getBrowserName(execution.options?.browserType),
      execution.steps.length,
      execution.steps.filter(s => s.status === 'passed').length,
      execution.steps.filter(s => s.status === 'failed').length,
      execution.videoPath ? t('common.yes') : t('common.no'),
      execution.steps.filter(s => s.screenshot).length,
      execution.steps[0]?.type ? getTranslatedStepTypeText(execution.steps[0].type, t) : '',
      execution.steps[execution.steps.length - 1]?.type ? getTranslatedStepTypeText(execution.steps[execution.steps.length - 1].type, t) : '',
      firstError ? `"${firstError.replace(/"/g, '""')}"` : '',
      lastStepDuration,
      avgStepDuration,
      maxStepDuration,
      new Date().toLocaleString('tr-TR')
    ];
  });

  return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
};

/**
 * Detaylı adım CSV raporu oluşturur
 */
export const createStepsCSVReport = (
  execution: ExecutionResult,
  t: (key: string, params?: any) => string
) => {
  const csvHeaders = [
    t('reports.stepNumber'),
    t('reports.stepId'),
    t('reports.stepType'),
    t('reports.status'),
    t('reports.startTime'),
    t('reports.endTime'),
    t('reports.duration'),
    t('reports.url'),
    t('reports.selector'),
    t('reports.value'),
    t('reports.expectedValue'),
    t('reports.error'),
    t('reports.screenshot')
  ];

  const csvRows = execution.steps.map((step, index) => {
    return [
      index + 1,
      step.stepId || '',
      getTranslatedStepTypeText(step.type, t),
      getTranslatedStatusText(step.status, t),
      step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
      step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
      step.duration || '',
      step.config?.url || '',
      step.config?.selector || '',
      step.config?.value || step.config?.text || '',
      step.config?.expectedValue || '',
      step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
      step.screenshot ? t('common.yes') : t('common.no')
    ];
  });

  return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
};

/**
 * Toplu adım CSV raporu oluşturur
 */
export const createBulkStepsCSVReport = (
  executions: ExecutionResult[],
  t: (key: string, params?: any) => string
) => {
  const csvHeaders = [
    t('reports.testName'),
    t('reports.executionId'),
    t('reports.stepNumber'),
    t('reports.stepId'),
    t('reports.stepType'),
    t('reports.status'),
    t('reports.startTime'),
    t('reports.endTime'),
    t('reports.duration'),
    t('reports.url'),
    t('reports.selector'),
    t('reports.value'),
    t('reports.expectedValue'),
    t('reports.error'),
    t('reports.screenshot')
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvRows: any[] = [];

  executions.forEach(execution => {
    execution.steps.forEach((step, index) => {
      csvRows.push([
        execution.workflowName,
        execution.id,
        index + 1,
        step.stepId || '',
        getTranslatedStepTypeText(step.type, t),
        getTranslatedStatusText(step.status, t),
        step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
        step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
        step.duration || '',
        step.config?.url || '',
        step.config?.selector || '',
        step.config?.value || step.config?.text || '',
        step.config?.expectedValue || '',
        step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
        step.screenshot ? t('common.yes') : t('common.no')
      ]);
    });
  });

  return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
};

/**
 * Tek execution için ZIP raporu indirir
 */
export const downloadExecutionReport = async (
  execution: ExecutionResult,
  t: (key: string, params?: any) => string
) => {
  try {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Create CSV reports
    const csvContent = createTestCSVReport([execution], t);
    const stepsCSVContent = createStepsCSVReport(execution, t);

    zip.file(`${t('reports.testReport')}.csv`, '\uFEFF' + csvContent);
    zip.file(`${t('reports.stepDetails')}.csv`, '\uFEFF' + stepsCSVContent);

    // Add screenshots
    const screenshotsFolder = zip.folder('screenshots');
    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      if (step.screenshot) {
        try {
          const response = await fetch(`${API_URL}${step.screenshot}`);
          if (response.ok) {
            const blob = await response.blob();
            const filename = `step_${i + 1}_${step.type}_${step.stepId?.slice(0, 8) || 'unknown'}.png`;
            screenshotsFolder?.file(filename, blob);
          }
        } catch (error) {
          console.error('Error downloading screenshot:', error);
        }
      }
    }

    // Add video if exists
    if (execution.videoPath) {
      try {
        const response = await fetch(`${API_URL}${execution.videoPath}`);
        if (response.ok) {
          const blob = await response.blob();
          zip.file('test_video.webm', blob);
        }
      } catch (error) {
        console.error('Error downloading video:', error);
      }
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${execution.workflowName}_${execution.id.slice(0, 8)}_rapor.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error creating report package:', error);
    throw new Error(t('reports.reportPackageError') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
  }
};

/**
 * Toplu execution'lar için ZIP raporu indirir
 */
export const downloadBulkExecutionReports = async (
  executions: ExecutionResult[],
  t: (key: string, params?: any) => string
) => {
  try {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Create main CSV report
    const csvContent = createTestCSVReport(executions, t);
    zip.file(`${t('reports.bulkTestReport')}.csv`, '\uFEFF' + csvContent);

    // Create consolidated steps CSV
    const allStepsCSV = createBulkStepsCSVReport(executions, t);
    zip.file(`${t('reports.allStepDetails')}.csv`, '\uFEFF' + allStepsCSV);

    // Add screenshots and videos for each execution
    for (let execIndex = 0; execIndex < executions.length; execIndex++) {
      const execution = executions[execIndex];
      const executionFolder = zip.folder(`${execIndex + 1}_${execution.workflowName.replace(/[^a-zA-Z0-9]/g, '_')}_${execution.id.slice(0, 8)}`);

      // Add individual execution reports
      const stepsCSV = createStepsCSVReport(execution, t);
      executionFolder?.file(`${t('reports.stepDetails')}.csv`, '\uFEFF' + stepsCSV);

      // Add screenshots for this execution
      const screenshotsFolder = executionFolder?.folder('screenshots');
      for (let i = 0; i < execution.steps.length; i++) {
        const step = execution.steps[i];
        if (step.screenshot) {
          try {
            const response = await fetch(`${API_URL}${step.screenshot}`);
            if (response.ok) {
              const blob = await response.blob();
              const filename = `step_${i + 1}_${step.type}_${step.stepId?.slice(0, 8) || 'unknown'}.png`;
              screenshotsFolder?.file(filename, blob);
            }
          } catch (error) {
            console.error('Error downloading screenshot:', error);
          }
        }
      }

      // Add video for this execution
      if (execution.videoPath) {
        try {
          const response = await fetch(`${API_URL}${execution.videoPath}`);
          if (response.ok) {
            const blob = await response.blob();
            executionFolder?.file('test_video.webm', blob);
          }
        } catch (error) {
          console.error('Error downloading video:', error);
        }
      }
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CosmicQA_${t('reports.bulkReport')}_${new Date().toISOString().split('T')[0]}_${executions.length}test.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error creating bulk report package:', error);
    throw new Error('Toplu rapor paketi oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
  }
};

// Helper functions
const getTranslatedStatusText = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'completed':
    case 'passed':
      return t('status.passed');
    case 'failed':
      return t('status.failed');
    case 'running':
      return t('status.running');
    case 'queued':
      return t('status.queued');
    case 'cancelled':
      return t('status.cancelled');
    case 'pending':
      return t('status.pending');
    case 'active':
      return t('status.active');
    case 'paused':
      return t('status.paused');
    case 'disabled':
      return t('status.disabled');
    default:
      return status;
  }
};

const getTranslatedStepTypeText = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'navigate':
      return t('testSteps.navigate');
    case 'click':
      return t('testSteps.click');
    case 'input':
    case 'type':
      return t('testSteps.input');
    case 'wait':
      return t('testSteps.wait');
    case 'refresh':
      return t('testSteps.refresh');
    case 'screenshot':
      return t('testSteps.screenshot');
    case 'verify':
      return t('testSteps.verify');
    case 'scroll':
      return t('testSteps.scroll');
    case 'hover':
      return t('testSteps.hover');
    case 'key':
      return t('testSteps.key');
    case 'dropdown':
      return t('testSteps.dropdown');
    case 'if':
      return t('testSteps.condition');
    default:
      return type;
  }
};


