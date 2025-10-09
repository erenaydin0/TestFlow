import { BrowserType, Test, ExecutionResult } from '@/types';
import { getBrowserName } from './browserUtils';

// Re-export for backward compatibility
export { getBrowserName };

// Common CSV download function
export const downloadCSV = (content: string, filename: string): void => {
  const dataStr = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(content)}`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataStr);
  linkElement.setAttribute('download', filename);
  linkElement.click();
};

// Test workflow export to CSV
export const exportTestsToCSV = (tests: Test[]): void => {
  const csvHeaders = [
    'Test Adı',
    'Açıklama',
    'Test Grubu',
    'Etiketler',
    'Tarayıcı',
    'Durum',
    'Adım Sayısı',
    'Screenshots',
    'Recording',
    'Headless',
    'Oluşturma Tarihi',
    'Güncelleme Tarihi',
    'Test ID'
  ];

  const csvRows = tests.map(test => [
    `"${test.name.replace(/"/g, '""')}"`,
    `"${test.description ? test.description.replace(/"/g, '""') : ''}"`,
    test.suite || '',
    `"${(test.tags || []).join(', ')}"`,
    getBrowserName(test.browserType),
    test.status || '',
    test.workflow ? test.workflow.length : 0,
    test.enableScreenshots ? 'Evet' : 'Hayır',
    test.enableRecording ? 'Evet' : 'Hayır',
    test.headlessMode ? 'Evet' : 'Hayır',
    test.createdAt ? new Date(test.createdAt).toLocaleString('tr-TR') : '',
    test.updatedAt ? new Date(test.updatedAt).toLocaleString('tr-TR') : '',
    test.id
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const filename = `CosmicQA-tests-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Helper for step type text
const getStepTypeText = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'navigate': 'Sayfaya Git',
    'click': 'Tıkla',
    'type': 'Metin Gir',
    'wait': 'Bekle',
    'scroll': 'Kaydır',
    'screenshot': 'Ekran Görüntüsü',
    'verify': 'Doğrula',
    'condition': 'Koşul',
    'keypress': 'Tuş Bas',
    'dropdown': 'Açılır Menü'
  };
  return typeMap[type.toLowerCase()] || type;
};

// Helper for status text
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'passed': 'Başarılı',
    'failed': 'Başarısız',
    'pending': 'Beklemede',
    'running': 'Çalışıyor',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
    'queued': 'Sırada'
  };
  return statusMap[status.toLowerCase()] || status;
};

// Execution results export to CSV
export const exportExecutionsToCSV = (executions: ExecutionResult[]): void => {
  const csvHeaders = [
    'Test Adı',
    'Execution ID',
    'Durum',
    'Başlangıç Zamanı',
    'Bitiş Zamanı',
    'Toplam Süre (ms)',
    'Başarı Oranı (%)',
    'Test Grubu',
    'Etiketler',
    'Tarayıcı',
    'Headless',
    'Screenshots',
    'Recording',
    'Toplam Adım',
    'Başarılı Adım',
    'Başarısız Adım',
    'Video Mevcut',
    'Ekran Görüntüsü Sayısı',
    'İlk Adım Türü',
    'Son Adım Türü',
    'İlk Hata',
    'Son Adım Süresi (ms)',
    'Ortalama Adım Süresi (ms)',
    'En Uzun Adım (ms)',
    'Raporlama Tarihi'
  ];
  
  const csvRows = executions.map(execution => {
    const avgStepDuration = execution.steps.length > 0 
      ? Math.round(execution.steps.reduce((sum, step) => sum + (step.duration || 0), 0) / execution.steps.length)
      : 0;
    const maxStepDuration = Math.max(...execution.steps.map(step => step.duration || 0));
    const firstError = execution.steps.find(step => step.error)?.error || '';
    const lastStepDuration = execution.steps[execution.steps.length - 1]?.duration || 0;
    
    return [
      execution.workflowName,
      execution.id,
      getStatusText(execution.status),
      execution.startTime ? new Date(execution.startTime).toLocaleString('tr-TR') : '',
      execution.endTime ? new Date(execution.endTime).toLocaleString('tr-TR') : '',
      execution.duration || '',
      execution.successRate || '',
      execution.suite || '',
      (execution.tags || []).join(', '),
      getBrowserName(execution.options?.browserType),
      execution.options?.headlessMode ? 'Evet' : 'Hayır',
      execution.options?.enableScreenshots ? 'Evet' : 'Hayır',
      execution.options?.enableRecording ? 'Evet' : 'Hayır',
      execution.steps.length,
      execution.steps.filter(s => s.status === 'passed').length,
      execution.steps.filter(s => s.status === 'failed').length,
      execution.videoPath ? 'Evet' : 'Hayır',
      execution.steps.filter(s => s.screenshot).length,
      execution.steps[0]?.type ? getStepTypeText(execution.steps[0].type) : '',
      execution.steps[execution.steps.length - 1]?.type ? getStepTypeText(execution.steps[execution.steps.length - 1].type) : '',
      firstError ? `"${firstError.replace(/"/g, '""')}"` : '',
      lastStepDuration,
      avgStepDuration,
      maxStepDuration,
      new Date().toLocaleString('tr-TR')
    ];
  });

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const filename = `CosmicQA-executions-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Single execution detailed steps export
export const exportExecutionStepsToCSV = (execution: ExecutionResult): void => {
  const csvHeaders = [
    'Adım No',
    'Adım ID',
    'Adım Türü',
    'Durum',
    'Başlangıç Zamanı',
    'Bitiş Zamanı',
    'Süre (ms)',
    'URL',
    'Selector',
    'Girilen Değer',
    'Beklenen Değer',
    'Hata Mesajı',
    'Ekran Görüntüsü'
  ];
  
  const csvRows = execution.steps.map((step, index) => [
    index + 1,
    step.stepId || '',
    getStepTypeText(step.type),
    getStatusText(step.status),
    step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
    step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
    step.duration || '',
    step.config?.url || '',
    step.config?.selector || '',
    step.config?.value || step.config?.text || '',
    step.config?.expectedValue || '',
    step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
    step.screenshot ? 'Var' : ''
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const filename = `${execution.workflowName}-steps-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Bulk execution steps export
export const exportBulkExecutionStepsToCSV = (executions: ExecutionResult[]): void => {
  const csvHeaders = [
    'Test Adı',
    'Execution ID',
    'Adım No',
    'Adım ID',
    'Adım Türü',
    'Durum',
    'Başlangıç Zamanı',
    'Bitiş Zamanı',
    'Süre (ms)',
    'URL',
    'Selector',
    'Girilen Değer',
    'Beklenen Değer',
    'Hata Mesajı',
    'Ekran Görüntüsü'
  ];
  
  const csvRows: (string | number)[][] = [];
  executions.forEach(execution => {
    execution.steps.forEach((step, index) => {
      csvRows.push([
        execution.workflowName,
        execution.id,
        index + 1,
        step.stepId || '',
        getStepTypeText(step.type),
        getStatusText(step.status),
        step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
        step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
        step.duration || '',
        step.config?.url || '',
        step.config?.selector || '',
        step.config?.value || step.config?.text || '',
        step.config?.expectedValue || '',
        step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
        step.screenshot ? 'Var' : ''
      ]);
    });
  });

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  const filename = `CosmicQA-bulk-steps-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Common filter logic for tests
export const filterTests = (
  tests: Test[], 
  filters: {
    search: string;
    suite: string[];
    tags: string[];
    browserType: BrowserType[];
  }
): Test[] => {
  return tests.filter(test => {
    // Search filter
    const matchesSearch = !filters.search || 
      test.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      test.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      test.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));

    // Suite filter  
    const matchesSuite = filters.suite.length === 0 || filters.suite.includes(test.suite);
    
    // Tags filter
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some(filterTag => test.tags.includes(filterTag));
    
    // Browser filter
    const matchesBrowser = filters.browserType.length === 0 || 
      filters.browserType.includes(test.browserType || 'chromium');

    return matchesSearch && matchesSuite && matchesTags && matchesBrowser;
  });
};

// Common filter logic for executions
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
  return executions.filter(execution => {
    // Search filter (by workflow name)
    const matchesSearch = !filters.search || 
      execution.workflowName.toLowerCase().includes(filters.search.toLowerCase());

    // Status filter
    const matchesStatus = !filters.status || execution.status === filters.status;

    // Suite filter
    const matchesSuite = filters.suite.length === 0 || 
      (execution.suite && filters.suite.includes(execution.suite));

    // Tags filter
    const matchesTags = filters.tags.length === 0 || 
      (execution.tags && execution.tags.some(tag => filters.tags.includes(tag)));

    // Browser filter
    const matchesBrowser = filters.browserType.length === 0 || 
      filters.browserType.includes(execution.options?.browserType || 'chromium');

    // Date filtering logic
    const executionDate = new Date(execution.startTime);
    executionDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Custom date range filter (highest priority)
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const matchesCustomRange = executionDate >= startDate && executionDate <= endDate;
      return matchesSearch && matchesStatus && matchesSuite && matchesTags && matchesBrowser && matchesCustomRange;
    }

    // Specific date filter (second priority)
    if (filters.specificDate) {
      const specificDate = new Date(filters.specificDate);
      specificDate.setHours(0, 0, 0, 0);
      const matchesSpecificDate = executionDate.toDateString() === specificDate.toDateString();
      return matchesSearch && matchesStatus && matchesSuite && matchesTags && matchesBrowser && matchesSpecificDate;
    }

    // Old date range filter (backward compatibility)
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

// Get unique values for filter options
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

  // Process tests
  tests.forEach(test => {
    if (test.suite) suites.add(test.suite);
    test.tags?.forEach(tag => tags.add(tag));
    if (test.browserType) browsers.add(test.browserType);
  });

  // Process executions if provided
  executions?.forEach(execution => {
    if (execution.suite) suites.add(execution.suite);
    execution.tags?.forEach(tag => tags.add(tag));
    if (execution.options?.browserType) browsers.add(execution.options.browserType);
    if (execution.status) statuses.add(execution.status);
  });

  return {
    suites: Array.from(suites).sort(),
    tags: Array.from(tags).sort(),
    browsers: Array.from(browsers).sort(),
    ...(executions && { statuses: Array.from(statuses).sort() })
  };
};
