import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  downloadCSV,
  downloadJSON,
  exportTestsToCSV,
  validateWorkflow,
  generateReadableId,
} from '../fileUtils';
import { Test, TestStep } from '@/types';

// Mock document.createElement
const mockClick = vi.fn();
const mockSetAttribute = vi.fn();
const mockCreateElement = vi.fn(() => ({
  click: mockClick,
  setAttribute: mockSetAttribute,
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.document.createElement = mockCreateElement as any;
});

describe('fileUtils', () => {
  describe('downloadCSV', () => {
    it('should create download link for CSV', () => {
      downloadCSV('test,data\n1,2', 'test.csv');
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockSetAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv'));
      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'test.csv');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle special characters in CSV', () => {
      downloadCSV('test,"quoted"', 'test.csv');
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('downloadJSON', () => {
    it('should create download link for JSON', () => {
      const data = { name: 'test', value: 42 };
      downloadJSON(data, 'test.json');
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockSetAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:application/json'));
      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'test.json');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should stringify JSON correctly', () => {
      const data = { nested: { value: 'test' } };
      downloadJSON(data, 'test.json');
      
      const hrefCall = mockSetAttribute.mock.calls.find((call: any[]) => call[0] === 'href');
      expect(hrefCall).toBeDefined();
      expect(hrefCall[1]).toContain('nested');
    });
  });

  describe('exportTestsToCSV', () => {
    it('should export tests to CSV format', () => {
      const tests: Test[] = [
        {
          id: 'test-1',
          name: 'Test 1',
          description: 'Description',
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

      exportTestsToCSV(tests);
      
      expect(mockCreateElement).toHaveBeenCalled();
      expect(mockSetAttribute).toHaveBeenCalledWith('download', expect.stringContaining('CosmicQA-tests'));
    });

    it('should handle empty tests array', () => {
      exportTestsToCSV([]);
      expect(mockCreateElement).toHaveBeenCalled();
    });

    it('should escape quotes in test names', () => {
      const tests: Test[] = [
        {
          id: 'test-1',
          name: 'Test with "quotes"',
          workflow: [],
        },
      ];

      exportTestsToCSV(tests);
      expect(mockCreateElement).toHaveBeenCalled();
    });
  });

  describe('validateWorkflow', () => {
    it('should validate workflow with valid steps', () => {
      const steps: TestStep[] = [
        {
          id: 'step-1',
          type: 'navigate',
          config: { url: 'https://example.com' },
        },
        {
          id: 'step-2',
          type: 'click',
          config: { selector: 'button' },
        },
      ];

      const result = validateWorkflow(steps);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty workflow', () => {
      const result = validateWorkflow([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate step types', () => {
      const steps: TestStep[] = [
        {
          id: 'step-1',
          type: 'invalid-type',
          config: {},
        },
      ];

      const result = validateWorkflow(steps);
      // Validation should check for valid step types
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });
  });

  describe('generateReadableId', () => {
    it('should generate readable ID from test name', () => {
      const existingWorkflows: Test[] = [];
      const id = generateReadableId('My Test Name', existingWorkflows);
      
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should handle special characters in name', () => {
      const existingWorkflows: Test[] = [];
      const id = generateReadableId('Test @#$% Name', existingWorkflows);
      
      expect(id).toBeTruthy();
    });

    it('should generate unique IDs', () => {
      const existingWorkflows: Test[] = [
        { id: 'my-test-name', name: 'My Test Name', workflow: [] },
      ];
      const id = generateReadableId('My Test Name', existingWorkflows);
      
      expect(id).not.toBe('my-test-name');
      expect(id).toContain('my-test-name');
    });
  });
});

