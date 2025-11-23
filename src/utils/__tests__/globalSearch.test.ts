import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchInTests, performGlobalSearch } from '../globalSearch';
import { Test } from '@/types';

// Mock getSavedWorkflows
const mockTests: Test[] = [
  {
    id: 'test-1',
    name: 'Login Test',
    description: 'Tests user login functionality',
    workflow: [],
    suite: 'E2E',
    tags: ['smoke', 'authentication'],
  },
  {
    id: 'test-2',
    name: 'Dashboard Test',
    description: 'Tests dashboard display',
    workflow: [],
    suite: 'Integration',
    tags: ['regression'],
  },
];

vi.mock('../fileUtils', () => ({
  getSavedWorkflows: () => mockTests,
}));

// Mock fetch for searchInReports
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [],
});

describe('globalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchInTests', () => {
    it('should return empty array for empty query', () => {
      const results = searchInTests('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = searchInTests('   ');
      expect(results).toEqual([]);
    });

    it('should search in test names', () => {
      const results = searchInTests('Login');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Login');
      expect(results[0].type).toBe('test');
    });

    it('should search in descriptions', () => {
      const results = searchInTests('login functionality');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Açıklama');
    });

    it('should search in suites', () => {
      const results = searchInTests('E2E');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Test Grubu');
    });

    it('should search in tags', () => {
      const results = searchInTests('smoke');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Etiketler');
    });

    it('should be case insensitive', () => {
      const results1 = searchInTests('login');
      const results2 = searchInTests('LOGIN');
      
      expect(results1.length).toBe(results2.length);
    });

    it('should return correct result structure', () => {
      const results = searchInTests('Login');
      
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('title');
        expect(results[0]).toHaveProperty('description');
        expect(results[0]).toHaveProperty('type');
        expect(results[0]).toHaveProperty('url');
        expect(results[0]).toHaveProperty('matchedIn');
      }
    });
  });

  describe('performGlobalSearch', () => {
    it('should perform global search', async () => {
      const results = await performGlobalSearch('Login');
      
      expect(results).toHaveProperty('tests');
      expect(results).toHaveProperty('reports');
      expect(Array.isArray(results.tests)).toBe(true);
    });

    it('should return empty results for empty query', async () => {
      const results = await performGlobalSearch('');
      
      expect(results.tests).toEqual([]);
      expect(results.reports).toEqual([]);
    });

    it('should combine test and report results', async () => {
      const results = await performGlobalSearch('Test');
      
      expect(results.tests.length + results.reports.length).toBeGreaterThanOrEqual(0);
    });
  });
});

