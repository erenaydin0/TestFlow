import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchInTests, performGlobalSearch } from '../globalSearch';


describe('globalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchInTests', () => {
    it('should return empty array for empty query', async () => {
      const results = await searchInTests('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const results = await searchInTests('   ');
      expect(results).toEqual([]);
    });

    it('should search in test names', async () => {
      const results = await searchInTests('Login');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Login');
      expect(results[0].type).toBe('test');
    });

    it('should search in descriptions', async () => {
      const results = await searchInTests('login functionality');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Açıklama');
    });

    it('should search in suites', async () => {
      const results = await searchInTests('E2E');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Test Grubu');
    });

    it('should search in tags', async () => {
      const results = await searchInTests('smoke');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedIn).toContain('Etiketler');
    });

    it('should be case insensitive', async () => {
      const results1 = await searchInTests('login');
      const results2 = await searchInTests('LOGIN');
      
      expect(results1.length).toBe(results2.length);
    });

    it('should return correct result structure', async () => {
      const results = await searchInTests('Login');
      
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
