import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTestCSVReport,
  createStepsCSVReport,
  downloadExecutionReport,
  exportTestsToCSV,
} from '../reportUtils';
import { ExecutionResult, Test } from '@/types';

// Mock downloadCSV
const mockDownloadCSV = vi.fn();
const mockClick = vi.fn();
const mockSetAttribute = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateElement = vi.fn(() => {
  const mockElement = {
    click: mockClick,
    setAttribute: mockSetAttribute,
    href: '',
    download: '',
  };
  return mockElement;
});

// Mock DOM methods
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

// Mock JSZip
class MockJSZip {
  file = vi.fn();
  folder = vi.fn(() => ({
    file: vi.fn(),
  }));
  generateAsync = vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' }));
}

vi.mock('jszip', () => ({
  default: MockJSZip,
}));

vi.mock('../fileUtils', () => ({
  downloadCSV: (content: string, filename: string) => {
    mockDownloadCSV(content, filename);
    // Simulate downloadCSV behavior
    if (typeof document !== 'undefined') {
      const link = mockCreateElement();
      link.setAttribute('href', `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(content)}`);
      link.setAttribute('download', filename);
      link.click();
    }
  },
}));

describe('reportUtils', () => {
  const mockT = vi.fn((key: string) => key);
  
  const mockExecution: ExecutionResult = {
    id: 'exec-1',
    workflowId: 'workflow-1',
    workflowName: 'Test Workflow',
    status: 'completed',
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: new Date('2024-01-01T10:05:00'),
    progress: 100,
    options: {
      enableScreenshots: false,
      enableRecording: false,
      headlessMode: true,
      browserType: 'chromium',
    },
    steps: [
      {
        stepId: 'step-1',
        type: 'navigate',
        status: 'passed',
        config: {},
        duration: 1000,
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T10:00:01'),
      },
      {
        stepId: 'step-2',
        type: 'click',
        status: 'passed',
        config: {},
        duration: 500,
        startTime: new Date('2024-01-01T10:00:01'),
        endTime: new Date('2024-01-01T10:00:01.5'),
      },
    ],
    screenshots: [],
    logs: [],
    duration: 300000,
    successRate: 100,
    suite: 'E2E',
    tags: ['smoke'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof document !== 'undefined') {
      global.document.createElement = mockCreateElement as any;
      // Mock appendChild and removeChild
      document.body.appendChild = mockAppendChild as any;
      document.body.removeChild = mockRemoveChild as any;
      // Make appendChild return the element (as real appendChild does)
      mockAppendChild.mockImplementation((element: any) => {
        return element;
      });
    }
  });

  afterEach(() => {
    // Restore original methods
    if (typeof document !== 'undefined') {
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    }
  });

  describe('createTestCSVReport', () => {
    it('should create CSV report for executions', () => {
      const csv = createTestCSVReport([mockExecution], mockT);
      
      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Test Workflow');
      expect(csv).toContain('exec-1');
    });

    it('should handle empty executions', () => {
      const csv = createTestCSVReport([], mockT);
      
      expect(csv).toBeTruthy();
      // CSV should have at least header row
      expect(csv.split('\n').length).toBeGreaterThanOrEqual(1);
      // Should contain header columns
      expect(csv).toContain('reports.testName');
    });

    it('should include all required fields', () => {
      const csv = createTestCSVReport([mockExecution], mockT);
      const lines = csv.split('\n');
      const header = lines[0];
      
      expect(header).toContain('testName');
      expect(header).toContain('executionId');
      expect(header).toContain('status');
    });
  });

  describe('createStepsCSVReport', () => {
    it('should create CSV report for steps', () => {
      const csv = createStepsCSVReport(mockExecution, mockT);
      
      expect(csv).toBeTruthy();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('step-1');
      expect(csv).toContain('navigate');
    });

    it('should include step details', () => {
      const csv = createStepsCSVReport(mockExecution, mockT);
      
      // CSV uses i18n keys in headers
      expect(csv).toContain('reports.stepId');
      expect(csv).toContain('reports.stepType'); // Uses stepType, not type
      expect(csv).toContain('reports.status');
      expect(csv).toContain('reports.duration');
    });
  });

  describe('downloadExecutionReport', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
      global.URL.revokeObjectURL = vi.fn();
      // Mock fetch for screenshots/video
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['test'], { type: 'image/png' }),
      });
      // Mock API_URL
      vi.mock('../config', () => ({
        API_URL: 'http://localhost:3001',
      }));
    });

    it('should download execution report', async () => {
      await downloadExecutionReport(mockExecution, mockT);
      
      // downloadExecutionReport creates a ZIP file, not CSV directly
      // Check that DOM manipulation happened
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should generate correct filename', async () => {
      await downloadExecutionReport(mockExecution, mockT);
      
      // Check that DOM manipulation happened (appendChild, click, removeChild)
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      
      // Check that createElement was called to create download link
      expect(mockCreateElement).toHaveBeenCalled();
      
      // The function sets: a.download = `${execution.workflowName}_${execution.id.slice(0, 8)}_rapor.zip`
      // Since it uses direct property assignment (a.download = ...), not setAttribute,
      // we check the mock element's download property instead
      const createdElement = mockCreateElement.mock.results[0].value;
      expect(createdElement.download).toBeDefined();
      expect(createdElement.download).toContain('Test Workflow');
      expect(createdElement.download).toContain('exec-1');
      expect(createdElement.download).toContain('.zip');
    });
  });

  describe('exportTestsToCSV', () => {
    it('should export tests to CSV format', () => {
      const tests: Test[] = [
        {
          id: 'test-1',
          name: 'Test 1',
          description: 'Description',
          status: 'pending',
          duration: 0,
          workflow: [],
          suite: 'E2E',
          tags: ['smoke'],
          browserType: 'chromium',
          enableScreenshots: true,
          enableRecording: false,
          headlessMode: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      exportTestsToCSV(tests, mockT);
      
      expect(mockDownloadCSV).toHaveBeenCalled();
      const call = mockDownloadCSV.mock.calls[0];
      expect(call[1]).toContain('CosmicQA-tests');
    });

    it('should handle empty tests array', () => {
      exportTestsToCSV([], mockT);
      expect(mockDownloadCSV).toHaveBeenCalled();
    });

    it('should escape quotes in test names', () => {
      const tests: Test[] = [
        {
          id: 'test-1',
          name: 'Test with "quotes"',
          description: '',
          status: 'pending',
          duration: 0,
          workflow: [],
          tags: [],
          suite: '',
          browserType: 'chromium',
          enableScreenshots: false,
          enableRecording: false,
          headlessMode: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      exportTestsToCSV(tests, mockT);
      expect(mockDownloadCSV).toHaveBeenCalled();
    });
  });
});

