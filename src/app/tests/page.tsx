'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSidebar } from '@/lib/sidebar-context';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Filter,
  Plus,
  MoreVertical,
  Tag,
  Clock,
  Copy,
  FileText,
  AlertCircle,
  Download,
  Upload,
  Search,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { formatDuration, formatRelativeTime, getSavedWorkflows, deleteWorkflow, duplicateWorkflow, exportTestWorkflow, migrateTestIds } from '@/lib/utils';
import { Test } from '@/types';
import ImportDialog from '@/components/test-builder/ImportDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import EditTestModal from '@/components/tests/EditTestModal';
import { useTestNotifications } from '@/hooks/useTestNotifications';
import { useBrowserSettings } from '@/lib/browser-context';

export default function TestsPage() {
  const { isCollapsed } = useSidebar();
  const browserSettings = useBrowserSettings();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [suiteFilter, setSuiteFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [highlightedTestId, setHighlightedTestId] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [singleDeleteDialog, setSingleDeleteDialog] = useState<{show: boolean; testId: string; testName: string}>({
    show: false,
    testId: '',
    testName: ''
  });
  const [editTestModal, setEditTestModal] = useState<{show: boolean; test: Test | null}>({
    show: false,
    test: null
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { notifyTestStart, notifyTestImported, notifyTestFailure, notifyTestDeleted, notifyTestDuplicated } = useTestNotifications();

  // Load saved workflows
  useEffect(() => {
    const loadTests = () => {
      try {
        // Önce ID migration'ı çalıştır
        migrateTestIds();
        
        const savedWorkflows = getSavedWorkflows();
        setTests(savedWorkflows);
      } catch (error) {
        console.error('Error loading tests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchFilter(searchQuery);
    }
  }, [searchParams]);

  // Handle testId parameter to highlight specific test
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && tests.length > 0) {
      setHighlightedTestId(testId);
      // Auto-scroll to the highlighted test after a short delay
      setTimeout(() => {
        const testElement = document.getElementById(`test-${testId}`);
        if (testElement) {
          testElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedTestId(null);
      }, 3000);
    }
  }, [searchParams, tests]);

  // Filter tests based on search, suite and tags
  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchFilter || 
      test.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      test.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      test.tags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesSuite = suiteFilter.length === 0 || suiteFilter.includes(test.suite);
    const matchesTags = tagsFilter.length === 0 || 
      tagsFilter.some(filterTag => test.tags.includes(filterTag));
    return matchesSearch && matchesSuite && matchesTags;
  });

  // Pagination logic
  const totalItems = filteredTests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageTests = filteredTests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, suiteFilter, tagsFilter]);

  // Get unique suites and tags for filter dropdowns
  const uniqueSuites = Array.from(new Set(tests.map(test => test.suite)));
  const uniqueTags = Array.from(new Set(tests.flatMap(test => test.tags)));

  // Handle test selection
  const handleTestSelection = (testId: string, checked: boolean) => {
    const newSelection = new Set(selectedTests);
    if (checked) {
      newSelection.add(testId);
    } else {
      newSelection.delete(testId);
    }
    setSelectedTests(newSelection);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests(new Set(currentPageTests.map(test => test.id)));
    } else {
      setSelectedTests(new Set());
    }
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Handle run test - Updated to use backend API
  const handleRunTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test || !test.workflow || test.workflow.length === 0) {
      notifyTestFailure(test?.name || 'Bilinmeyen Test', testId, 'Test workflow\'u bulunamadı veya boş.');
      return;
    }


    // Debug: Browser ayarlarını kontrol et
    console.log('🔍 TESTS PAGE DEBUG:');
    console.log('- browserSettings:', browserSettings);
    console.log('- test.browserType:', test.browserType);
    console.log('- Final browserType:', test.browserType || browserSettings.defaultBrowser);

    try {
      // Convert frontend steps to backend format
      const backendSteps = test.workflow.map(step => ({
        id: step.id,
        type: step.type,
        config: {
          url: step.url,
          selector: step.selector,
          value: step.value,
          text: step.value, // For type actions
          target: step.selector, // Alternative selector name
          duration: step.duration,
          condition: step.condition,
          expectedValue: step.expectedValue,
          direction: step.direction,
          amount: step.amount,
          filename: step.filename,
          key: step.key
        }
      }));
      
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: test.id,
          workflowName: test.name,
          steps: backendSteps,
          suite: test.suite,
          tags: test.tags,
          options: {
            enableScreenshots: test.enableScreenshots || browserSettings.defaultScreenshots,
            enableRecording: test.enableRecording || browserSettings.defaultRecording,
            headlessMode: test.headlessMode !== undefined ? test.headlessMode : browserSettings.defaultHeadless,
            browserType: test.browserType || browserSettings.defaultBrowser
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      notifyTestStart(test.name, data.executionId);
      
    } catch (error) {
      console.error('Test execution error:', error);
      notifyTestFailure(test.name, testId, error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  };

  // Handle edit test workflow
  const handleEditTest = (testId: string) => {
    // Navigate to test builder with the workflow loaded
    router.push(`/test-builder?load=${testId}`);
  };

  // Handle edit test metadata (name, description, tags, suite)
  const handleEditTestMetadata = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setEditTestModal({
        show: true,
        test: test
      });
    }
  };

  // Handle test update from modal
  const handleTestUpdate = (updatedTest: Test) => {
    // Update local state
    setTests(prevTests => 
      prevTests.map(test => 
        test.id === updatedTest.id ? updatedTest : test
      )
    );
    
    // Show success notification
    notifyTestImported(`${updatedTest.name} güncellendi`, '');
  };

  // Handle duplicate test
  const handleDuplicateTest = async (testId: string) => {
    try {
      const test = tests.find(t => t.id === testId);
      const duplicatedId = duplicateWorkflow(testId);
      if (duplicatedId && test) {
        // Reload tests
        const updatedTests = getSavedWorkflows();
        setTests(updatedTests);
        notifyTestDuplicated(test.name, duplicatedId);
      }
    } catch (error) {
      const test = tests.find(t => t.id === testId);
      notifyTestFailure(test?.name || 'Bilinmeyen Test', testId, 'Test kopyalanırken hata oluştu.');
    }
  };

  // Handle delete test
  const handleDeleteTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setSingleDeleteDialog({
        show: true,
        testId: testId,
        testName: test.name
      });
    }
  };

  const confirmSingleDelete = () => {
    try {
      if (deleteWorkflow(singleDeleteDialog.testId)) {
        // Reload tests
        const updatedTests = getSavedWorkflows();
        setTests(updatedTests);
        setSelectedTests(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(singleDeleteDialog.testId);
          return newSelection;
        });
        notifyTestDeleted(singleDeleteDialog.testName, singleDeleteDialog.testId);
      }
    } catch (error) {
      notifyTestFailure(singleDeleteDialog.testName, singleDeleteDialog.testId, 'Test silinirken hata oluştu.');
    }
  };

  // Handle bulk duplicate
  const handleBulkDuplicate = async () => {
    if (selectedTests.size === 0) return;
    
    try {
      let duplicatedCount = 0;
      const duplicatedTests: string[] = [];
      
      selectedTests.forEach(testId => {
        const test = tests.find(t => t.id === testId);
        const duplicatedId = duplicateWorkflow(testId);
        if (duplicatedId && test) {
          duplicatedCount++;
          duplicatedTests.push(test.name);
        }
      });
      
      // Reload tests
      const updatedTests = getSavedWorkflows();
      setTests(updatedTests);
      setSelectedTests(new Set());
      
      if (duplicatedCount > 0) {
        notifyTestDuplicated(`${duplicatedCount} test`, '');
      }
    } catch (error) {
      notifyTestFailure('Bulk Duplicate', '', 'Testler kopyalanırken hata oluştu.');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTests.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    try {
      let deletedCount = 0;
      selectedTests.forEach(testId => {
        if (deleteWorkflow(testId)) {
          deletedCount++;
        }
      });
      
      // Reload tests
      const updatedTests = getSavedWorkflows();
      setTests(updatedTests);
      setSelectedTests(new Set());
      notifyTestDeleted(`${deletedCount} test`, '');
    } catch (error) {
      notifyTestFailure('Bulk Delete', '', 'Testler silinirken hata oluştu.');
    }
  };

  // Handle bulk run - Updated to use backend API
  const handleBulkRun = async () => {
    if (selectedTests.size === 0) return;
    
    const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
    const validTests = selectedTestsData.filter(test => test.workflow && test.workflow.length > 0);
    
    if (validTests.length === 0) {
      notifyTestFailure('Bulk Run', '', 'Seçilen testlerde çalıştırılabilir workflow bulunamadı.');
      return;
    }

    try {
      const executionPromises = validTests.map(async (test) => {
        // Convert frontend steps to backend format
        const backendSteps = test.workflow!.map(step => ({
          id: step.id,
          type: step.type,
          config: {
            url: step.url,
            selector: step.selector,
            value: step.value,
            text: step.value, // For type actions
            target: step.selector, // Alternative selector name
            duration: step.duration,
            condition: step.condition,
            expectedValue: step.expectedValue,
            direction: step.direction,
            amount: step.amount,
            filename: step.filename,
            key: step.key
          }
        }));
        
        const response = await fetch('http://localhost:3001/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: test.id,
            workflowName: test.name,
            steps: backendSteps,
            suite: test.suite,
            tags: test.tags,
            options: {
              enableScreenshots: test.enableScreenshots || false,
              enableRecording: test.enableRecording || false,
              headlessMode: test.headlessMode || false
            }
          })
        });

        if (!response.ok) {
          throw new Error(`${test.name}: HTTP error! status: ${response.status}`);
        }

        return await response.json();
      });

      const results = await Promise.all(executionPromises);
      const executionIds = results.map(r => r.executionId);
      
      notifyTestStart(`${validTests.length} test`, executionIds.join(','));
      
    } catch (error) {
      console.error('Bulk test execution error:', error);
      notifyTestFailure('Bulk Run', '', `Testler çalıştırılırken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Backend server'ın çalıştığından emin olun.`);
    }
  };

  // Navigate to test builder
  const handleCreateNewTest = () => {
    router.push('/test-builder');
  };

  // Handle single test export
  const handleExportTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test && test.workflow) {
      try {
        exportTestWorkflow(test.workflow, `${test.name}.json`);
        notifyTestImported(`"${test.name}" başarıyla export edildi!`, testId);
      } catch (error) {
        notifyTestFailure('Export', '', 'Export işlemi sırasında hata oluştu.');
      }
    }
  };

  // Handle bulk export (selected tests)
  const handleBulkExport = () => {
    if (selectedTests.size === 0) {
      notifyTestFailure('Export', '', 'Export edilecek test seçin.');
      return;
    }

    const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
    
    if (selectedTestsData.length === 1) {
      // Single test export
      const test = selectedTestsData[0];
      if (test.workflow) {
        exportTestWorkflow(test.workflow, `${test.name}.json`);
        notifyTestImported(`"${test.name}" başarıyla export edildi!`, test.id);
      }
    } else {
      // Multiple tests export
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'multiple-workflows',
        workflows: selectedTestsData.map(test => ({
          name: test.name,
          description: test.description,
          steps: test.workflow || [],
          tags: test.tags,
          suite: test.suite,
          metadata: {
            createdAt: test.createdAt,
            updatedAt: test.updatedAt,
            originalId: test.id
          }
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileName = `CosmicQA-workflows-${selectedTestsData.length}-tests-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();

      notifyTestImported(`${selectedTestsData.length} test başarıyla export edildi!`, '');
    }
  };

  // Handle import
  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  // Handle import success
  const handleImportSuccess = (importedCount: number) => {
    // Reload tests after successful import
    const updatedTests = getSavedWorkflows();
    setTests(updatedTests);
    setIsImportDialogOpen(false);
    notifyTestImported(`${importedCount} workflow`, '');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <div style={{ 
          flex: 1, 
          marginLeft: '16rem',
          paddingTop: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Yükleniyor...</div>
            <div style={{ fontSize: '0.875rem' }}>Kaydedilen testler yükleniyor</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4rem' : '16rem',
        transition: 'margin-left 0.3s ease',
        paddingTop: '4rem'
      }}>
        <Header />
        
        <main style={{ padding: '1.5rem' }}>
          {/* Header with stats */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)', 
                margin: 0 
            }}>
              Kayıtlı Testler
            </h1>
            <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0.5rem 0 0 0' 
            }}>
              Toplam {tests.length} kayıtlı test bulunuyor • {filteredTests.length} gösteriliyor
              {totalPages > 1 && (
                <span style={{ marginLeft: '0.5rem' }}>
                  (Sayfa {currentPage} / {totalPages})
                </span>
              )}
            </p>
          </div>

          {/* Tests List */}
          <div className="card">
          <div style={{ 
            display: 'flex', 
              justifyContent: 'space-between', 
            alignItems: 'center',
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                {/* Test Name Search */}
                <div style={{ position: 'relative', minWidth: '150px' }}>
                  <Search size={14} style={{ 
                    position: 'absolute', 
                    left: '0.5rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-secondary)' 
                  }} />
                  <input
                    type="text"
                    placeholder="Test adı..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.5rem 0.375rem 2rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Suite Filter */}
                <MultiSelect
                  options={uniqueSuites}
                  selectedValues={suiteFilter}
                  onChange={setSuiteFilter}
                  placeholder="Tüm Test Grupları"
                  className="min-w-[120px]"
                />

                {/* Tags Filter */}
                <MultiSelect
                  options={uniqueTags}
                  selectedValues={tagsFilter}
                  onChange={setTagsFilter}
                  placeholder="Tüm Etiketler"
                  className="min-w-[120px]"
                />

                {/* Clear Filters Button */}
                {(searchFilter || suiteFilter.length > 0 || tagsFilter.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setSuiteFilter([]);
                      setTagsFilter([]);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <X size={12} />
                    Temizle
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Import/Export Buttons */}
                {selectedTests.size > 0 && (
                  <>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {selectedTests.size} test seçili
                    </span>
                    
                    <button
                      onClick={() => setSelectedTests(new Set())}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.5rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <X size={12} />
                      Temizle
                    </button>
                    <button 
                      onClick={handleBulkRun}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #059669',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        color: '#059669',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Çalıştır
                    </button>
                    <button 
                      onClick={handleBulkDuplicate}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #7c3aed',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        color: '#7c3aed',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                      }}
                    >
                      <Copy size={12} />
                      Kopyala
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #dc2626',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Sil
                    </button>
                    <button 
                      onClick={handleBulkExport}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #2563eb',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                    >
                      <Download size={12} />
                      Dışa Aktar
                    </button>
                  </>
                )}

                <button 
                  onClick={handleImport}
                  style={{
                    padding: '0.375rem 0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <Upload size={12} />
                  İçe Aktar
                </button>
                <button 
                  onClick={handleCreateNewTest}
                  className="btn-primary" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem'
                  }}
                >
                  <Plus size={12} />
                  Yeni Test
                </button>
              </div>
            </div>

            {/* Separator */}
            <div style={{ 
              borderTop: '1px solid var(--border-primary)', 
              margin: '1rem -1.5rem 0 -1.5rem' 
            }}></div>

            {/* Test Content */}
            {filteredTests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <FileText size={24} color="var(--text-secondary)" />
              </div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0'
              }}>
                {tests.length === 0 ? 'Henüz test workflow\'u yok' : 'Filtreye uygun test bulunamadı'}
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                margin: '0 0 1.5rem 0'
              }}>
                {tests.length === 0 
                  ? 'Test builder\'da ilk workflow\'unuzu oluşturun'
                  : 'Farklı filtreler deneyerek aradığınız testleri bulabilirsiniz'
                }
              </p>
              <button 
                onClick={handleCreateNewTest}
                className="btn-primary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                <Plus size={16} />
                İlk Test Workflow'unu Oluştur
              </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', margin: '0 -1.5rem -1.5rem -1.5rem' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      <input 
                        type="checkbox" 
                          checked={selectedTests.size === currentPageTests.length && currentPageTests.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{ 
                          borderRadius: '0.25rem', 
                          border: '1px solid var(--border-primary)' 
                        }} 
                      />
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Adı
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                        Adım Sayısı
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                        Oluşturulma
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Grubu
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Etiketler
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                    {currentPageTests.map((test) => (
                    <tr 
                      key={test.id}
                      id={`test-${test.id}`}
                      style={{ 
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'all 0.3s ease',
                        backgroundColor: highlightedTestId === test.id ? 'var(--bg-tertiary)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (highlightedTestId !== test.id) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (highlightedTestId !== test.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                            checked={selectedTests.has(test.id)}
                            onChange={(e) => handleTestSelection(test.id, e.target.checked)}
                          style={{ 
                            borderRadius: '0.25rem', 
                            border: '1px solid var(--border-primary)' 
                          }} 
                        />
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <h3 
                            onClick={() => handleEditTest(test.id)}
                            style={{ 
                              fontWeight: 500, 
                              color: 'var(--text-primary)',
                              margin: 0,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-primary)';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                            title="Düzenlemek için tıklayın"
                          >
                            {test.name}
                          </h3>
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-secondary)', 
                            margin: '0.25rem 0 0 0'
                          }}>
                            {test.description}
                          </p>
                        </div>
                      </td>
                      
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                            <span>{test.workflow?.length || 0} adım</span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                            {formatRelativeTime(test.createdAt)}
                        </span>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                          {test.suite}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {test.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.125rem 0.5rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border-primary)'
                              }}
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {test.tags.length > 2 && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-tertiary)' 
                            }}>
                              +{test.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleRunTest(test.id)}
                              style={{ 
                              padding: '0.25rem', 
                              color: '#059669', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Testi Çalıştır"
                            >
                              <Play size={16} />
                            </button>
                          
                            <button 
                              onClick={() => handleEditTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                              title="Workflow'u Düzenle"
                            >
                            <Edit size={16} />
                          </button>
                          
                            <button 
                              onClick={() => handleEditTestMetadata(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                              title="Test Bilgilerini Düzenle"
                            >
                            <Settings size={16} />
                          </button>
                          
                            <button 
                              onClick={() => handleExportTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                                color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                              title="Testi Dışa Aktar"
                            >
                              <Download size={16} />
                          </button>
                          
                            <button 
                              onClick={() => handleDuplicateTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                              title="Testi Kopyala"
                            >
                              <Copy size={16} />
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteTest(test.id)}
                              style={{ 
                                padding: '0.25rem', 
                                color: '#dc2626', 
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Testi Sil"
                            >
                              <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  {/* Pagination Info */}
                  <div style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.875rem' 
                  }}>
                    {totalItems > 0 ? (
                      <>
                        <span>{startIndex + 1} - {Math.min(endIndex, totalItems)}</span>
                        <span style={{ margin: '0 0.25rem' }}>•</span>
                        <span>{totalItems} toplam test</span>
                      </>
                    ) : (
                      'Test bulunamadı'
                    )}
                  </div>

                  {/* Pagination Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.375rem',
                        backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="İlk sayfa"
                    >
                      <ChevronsLeft size={14} />
                    </button>

                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.375rem',
                        backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Önceki sayfa"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Page Numbers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => goToPage(i)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2rem',
                                height: '2rem',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '0.375rem',
                                backgroundColor: i === currentPage ? '#2563eb' : 'var(--bg-primary)',
                                color: i === currentPage ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: i === currentPage ? '600' : '400',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.375rem',
                        backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Sonraki sayfa"
                    >
                      <ChevronRight size={14} />
                    </button>

                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.375rem',
                        backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Son sayfa"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Testleri Sil"
        message={`${selectedTests.size} testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={singleDeleteDialog.show}
        onClose={() => setSingleDeleteDialog({show: false, testId: '', testName: ''})}
        onConfirm={confirmSingleDelete}
        title="Testi Sil"
        message={`"${singleDeleteDialog.testName}" testini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />

      {/* Edit Test Modal */}
      <EditTestModal
        isOpen={editTestModal.show}
        onClose={() => setEditTestModal({show: false, test: null})}
        onUpdate={handleTestUpdate}
        test={editTestModal.test}
      />
    </div>
  );
} 