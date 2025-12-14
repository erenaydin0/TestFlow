import { TestService, ExecutionService } from './api';
import { Test } from '@/types';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'test' | 'report';
  url: string;
  status?: string;
  suite?: string;
  tags?: string[];
  matchedIn?: string[];
}

// Helper function to search within tests array
const filterTestsByQuery = (tests: Test[], query: string): SearchResult[] => {
  const results: SearchResult[] = [];
  const searchTerm = query.toLowerCase();
  
  tests.forEach(test => {
    const matchedIn: string[] = [];
    let matches = false;
    
    // Test adında ara
    if (test.name.toLowerCase().includes(searchTerm)) {
      matchedIn.push('İsim');
      matches = true;
    }
    
    // Açıklamada ara
    if (test.description?.toLowerCase().includes(searchTerm)) {
      matchedIn.push('Açıklama');
      matches = true;
    }
    
    // Test grubunda ara
    if (test.suite?.toLowerCase().includes(searchTerm)) {
      matchedIn.push('Test Grubu');
      matches = true;
    }
    
    // Etiketlerde ara
    if (test.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
      matchedIn.push('Etiketler');
      matches = true;
    }
    
    if (matches) {
      results.push({
        id: test.id,
        title: test.name,
        description: test.description || 'Açıklama yok',
        type: 'test',
        url: `/tests?testId=${test.id}`,
        status: test.status,
        suite: test.suite,
        tags: test.tags,
        matchedIn
      });
    }
  });
  
  return results;
};

// Test verilerinde arama yap - API'den veri çeker
export const searchInTests = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    // API'den testleri çek
    const tests = await TestService.fetchTests();
    return filterTestsByQuery(tests, query);
  } catch (error) {
    console.error('Error searching in tests:', error);
    return [];
  }
};

// Rapor verilerinde arama yap
export const searchInReports = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    // API client kullanarak workspace ID header'ı otomatik eklenir
    const executions = await ExecutionService.fetchExecutions();
    const results: SearchResult[] = [];
    
    const searchTerm = query.toLowerCase();
    
    executions.forEach((execution: any) => {
      const matchedIn: string[] = [];
      let matches = false;
      
      // Workflow adında ara
      if (execution.workflowName?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('Test Adı');
        matches = true;
      }
      
      // Test grubunda ara
      if (execution.suite?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('Test Grubu');
        matches = true;
      }
      
      // Etiketlerde ara
      if (execution.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))) {
        matchedIn.push('Etiketler');
        matches = true;
      }
      
      // Execution ID'de ara
      if (execution.id?.toLowerCase().includes(searchTerm)) {
        matchedIn.push('Execution ID');
        matches = true;
      }
      
      if (matches) {
        results.push({
          id: execution.id,
          title: execution.workflowName,
          description: new Date(execution.startTime).toLocaleDateString('tr-TR'),
          type: 'report',
          url: `/reports?executionId=${execution.id}`,
          status: execution.status,
          suite: execution.suite,
          tags: execution.tags,
          matchedIn
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching in reports:', error);
    return [];
  }
};

// Global arama fonksiyonu
export const performGlobalSearch = async (query: string): Promise<{
  tests: SearchResult[];
  reports: SearchResult[];
  total: number;
  totalTests: number;
  totalReports: number;
}> => {
  if (!query.trim()) {
    return { tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 };
  }
  
  try {
    const [testResults, reportResults] = await Promise.all([
      searchInTests(query),
      searchInReports(query)
    ]);
    
    return {
      tests: testResults.slice(0, 5), // Limit to 5 results per category
      reports: reportResults.slice(0, 5),
      total: testResults.length + reportResults.length,
      totalTests: testResults.length,
      totalReports: reportResults.length
    };
  } catch (error) {
    console.error('Error performing global search:', error);
    return { tests: [], reports: [], total: 0, totalTests: 0, totalReports: 0 };
  }
};
