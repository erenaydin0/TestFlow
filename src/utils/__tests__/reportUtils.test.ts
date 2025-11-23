import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestCSVReport,
  createStepsCSVReport,
  downloadExecutionReport,
} from '../reportUtils';
import { ExecutionResult } from '@/types';

// Mock downloadCSV
const mockDownloadCSV = vi.fn();
vi.mock('../fileUtils', () => ({
  downloadCSV: (content: string, filename: string) => mockDownloadCSV(content, filename),
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
      expect(csv.split('\n').length).toBeGreaterThan(1); // Header + empty
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
      
      expect(csv).toContain('stepId');
      expect(csv).toContain('type');
      expect(csv).toContain('status');
      expect(csv).toContain('duration');
    });
  });

  describe('downloadExecutionReport', () => {
    it('should download execution report', async () => {
      await downloadExecutionReport(mockExecution, mockT);
      
      expect(mockDownloadCSV).toHaveBeenCalled();
    });

    it('should generate correct filename', async () => {
      await downloadExecutionReport(mockExecution, mockT);
      
      const call = mockDownloadCSV.mock.calls[0];
      expect(call[1]).toContain('exec-1');
      expect(call[1]).toContain('.csv');
    });
  });
});

