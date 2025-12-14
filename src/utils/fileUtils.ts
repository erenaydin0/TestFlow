import { BrowserType, Test, ExecutionResult, TestStep } from '@/types';
import { getBrowserName } from '@/types/browser';

// Re-export for backward compatibility
export { getBrowserName };

// Types
interface WorkflowMetadata {
  description?: string;
  tags?: string[];
  suite?: string;
  browserType?: BrowserType;
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
}

// File download utilities
export const downloadCSV = (content: string, filename: string): void => {
  const dataStr = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(content)}`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataStr);
  linkElement.setAttribute('download', filename);
  linkElement.click();
};

export const downloadJSON = (content: any, filename: string): void => {
  const dataStr = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(content, null, 2))}`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataStr);
  linkElement.setAttribute('download', filename);
  linkElement.click();
};

// CSV Export functions moved to reportUtils.ts for i18n support

// JSON Import/Export functions
export const exportTestWorkflow = (
  testSteps: TestStep[],
  fileName?: string,
  metadata?: WorkflowMetadata
) => {
  const workflow = {
    version: '1.1',
    name: fileName || 'test-workflow',
    description: metadata?.description || '',
    createdAt: new Date().toISOString(),
    metadata: {
      tags: metadata?.tags || [],
      suite: metadata?.suite || 'Default',
      browserType: metadata?.browserType || 'chromium',
      enableScreenshots: metadata?.enableScreenshots || false,
      enableRecording: metadata?.enableRecording || false,
      headlessMode: metadata?.headlessMode || false
    },
    steps: testSteps.map(step => ({
      ...step
    }))
  };

  const filename = `${workflow.name}-${new Date().toISOString().split('T')[0]}.json`;
  downloadJSON(workflow, filename);
};

export const importTestWorkflow = (file: File): Promise<{
  steps: TestStep[];
  name: string;
  metadata?: WorkflowMetadata;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workflow = JSON.parse(content);

        if (!workflow.steps || !Array.isArray(workflow.steps)) {
          throw new Error('Geçersiz workflow dosyası: steps bulunamadı');
        }

        const validSteps = workflow.steps.filter((step: any) => {
          return step.id && step.type;
        });

        if (validSteps.length === 0) {
          throw new Error('Geçersiz workflow dosyası: geçerli adım bulunamadı');
        }

        resolve({
          steps: validSteps,
          name: workflow.name || 'imported-workflow',
          metadata: {
            description: workflow.description || '',
            tags: workflow.metadata?.tags || workflow.tags || [],
            suite: workflow.metadata?.suite || workflow.suite || 'Default',
            browserType: workflow.metadata?.browserType || workflow.browserType || 'chromium',
            enableScreenshots: workflow.metadata?.enableScreenshots || workflow.enableScreenshots || false,
            enableRecording: workflow.metadata?.enableRecording || workflow.enableRecording || false,
            headlessMode: workflow.metadata?.headlessMode || workflow.headlessMode || false
          }
        });
      } catch (error) {
        reject(new Error(`Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };

    reader.readAsText(file);
  });
};

// Helper functions moved to reportUtils.ts for i18n support

// Workflow validation
export const validateWorkflow = (steps: TestStep[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const ids = steps.map(step => step.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate step IDs found: ${duplicateIds.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Filter functions
export const filterTests = (
  tests: Test[],
  filters: {
    search: string;
    suite: string[];
    tags: string[];
    browserType: BrowserType[];
  }
): Test[] => {
  // Ensure tests is an array before filtering
  if (!Array.isArray(tests)) {
    return [];
  }
  return tests.filter(test => {
    const matchesSearch = !filters.search ||
      test.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      test.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      test.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesSuite = filters.suite.length === 0 || filters.suite.includes(test.suite || '');

    const matchesTags = filters.tags.length === 0 ||
      (test.tags || []).some(filterTag => (test.tags || []).includes(filterTag));

    const matchesBrowser = filters.browserType.length === 0 ||
      filters.browserType.includes(test.browserType || 'chromium');

    return matchesSearch && matchesSuite && matchesTags && matchesBrowser;
  });
};

export const filterExecutions = (
  executions: ExecutionResult[],
  filters: {
    search: string;
    status?: string;
    suite: string[];
    tags: string[];
    browserType: BrowserType[];
    dateRange?: string;
    specificDate?: string;
    startDate?: string;
    endDate?: string;
  }
): ExecutionResult[] => {
  // Ensure executions is an array before filtering
  if (!Array.isArray(executions)) {
    return [];
  }
  return executions.filter(execution => {
    const matchesSearch = !filters.search ||
      execution.workflowName.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = !filters.status || execution.status === filters.status;

    const matchesSuite = filters.suite.length === 0 ||
      (execution.suite && filters.suite.includes(execution.suite));

    const matchesTags = filters.tags.length === 0 ||
      (execution.tags && execution.tags.some(tag => filters.tags.includes(tag)));

    const matchesBrowser = filters.browserType.length === 0 ||
      filters.browserType.includes(execution.options?.browserType || 'chromium');

    const executionDate = new Date(execution.startTime);
    executionDate.setHours(0, 0, 0, 0);

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const matchesCustomRange = executionDate >= startDate && executionDate <= endDate;
      return matchesSearch && matchesStatus && matchesSuite && matchesTags && matchesBrowser && matchesCustomRange;
    }

    if (filters.specificDate) {
      const specificDate = new Date(filters.specificDate);
      specificDate.setHours(0, 0, 0, 0);
      const matchesSpecificDate = executionDate.toDateString() === specificDate.toDateString();
      return matchesSearch && matchesStatus && matchesSuite && matchesTags && matchesBrowser && matchesSpecificDate;
    }

    let matchesDateRange = true;
    if (filters.dateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      switch (filters.dateRange) {
        case 'today':
          matchesDateRange = executionDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDateRange = executionDate.toDateString() === yesterday.toDateString();
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDateRange = executionDate >= sevenDaysAgo;
          break;
        case 'last30days':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          matchesDateRange = executionDate >= thirtyDaysAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesSuite && matchesTags && matchesBrowser && matchesDateRange;
  });
};

export const getUniqueFilterOptions = (
  tests: Test[],
  executions?: ExecutionResult[]
): {
  suites: string[];
  tags: string[];
  browsers: BrowserType[];
  statuses?: string[];
} => {
  const suites = new Set<string>();
  const tags = new Set<string>();
  const browsers = new Set<BrowserType>();
  const statuses = new Set<string>();

  // Ensure tests is an array before iterating
  if (Array.isArray(tests)) {
    tests.forEach(test => {
      if (test.suite) suites.add(test.suite);
      test.tags?.forEach(tag => tags.add(tag));
      if (test.browserType) browsers.add(test.browserType);
    });
  }

  if (Array.isArray(executions)) {
    executions.forEach(execution => {
      if (execution.suite) suites.add(execution.suite);
      execution.tags?.forEach(tag => tags.add(tag));
      if (execution.options?.browserType) browsers.add(execution.options.browserType);
      if (execution.status) statuses.add(execution.status);
    });
  }

  return {
    suites: Array.from(suites).sort(),
    tags: Array.from(tags).sort(),
    browsers: Array.from(browsers).sort(),
    ...(executions && { statuses: Array.from(statuses).sort() })
  };
};
