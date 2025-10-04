'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import { 
  Plus,
  Copy,
  FileText,
  Download,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { exportTestWorkflow } from '@/lib/utils';
import { Test } from '@/types';
import ImportDialog from '@/components/test-builder/ImportDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import TestModal from '@/components/TestModal';
import DataFilters from '@/components/common/DataFilters';
import DataTable, { Column } from '@/components/common/DataTable';
import { BrowserCell, TagsCell, ActionsCell, StepCountCell, TestNameCell } from '@/components/common/TableCells';
import { useTestNotifications } from '@/hooks/useTestNotifications';
import { useBrowserSettings } from '@/lib/browser-context';
import { exportTestsToCSV } from '@/lib/exportUtils';
import { useTests } from '@/hooks/useTests';
import { Button, IconButton, ButtonGroup } from '@/components/ui';

export default function TestsPage() {
  const browserSettings = useBrowserSettings();
  const { 
    tests, 
    loading, 
    filteredTests, 
    filters, 
    setFilters, 
    filterOptions, 
    refresh,
    deleteTest,
    duplicateTest,
    updateTest,
    bulkDeleteTests,
    bulkDuplicateTests
  } = useTests();
  
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
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
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { notifyTestStart, notifyTestImported, notifyTestFailure, notifyTestDeleted, notifyTestDuplicated } = useTestNotifications();

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
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

  // filteredTests artık useTests hook'undan geliyor

  // Sort tests
  const sortedTests = useMemo(() => {
    const sorted = [...filteredTests];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stepCount':
          aValue = a.workflow?.length || 0;
          bValue = b.workflow?.length || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'suite':
          aValue = (a.suite || '').toLowerCase();
          bValue = (b.suite || '').toLowerCase();
          break;
        case 'tags':
          aValue = (a.tags || []).length;
          bValue = (b.tags || []).length;
          break;
        case 'browserType':
          aValue = a.browserType || 'chromium';
          bValue = b.browserType || 'chromium';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredTests, sortField, sortOrder]);

  // Pagination logic
  const totalItems = sortedTests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageTests = sortedTests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // filterOptions artık useTests hook'undan geliyor

  // Define table columns for DataTable
  const columns: Column<Test>[] = [
    {
      key: 'name',
      label: 'Test Adı',
      sortable: true,
      render: (value, test) => (
        <TestNameCell 
          name={test.name} 
          description={test.description} 
          id={test.id}
        />
      )
    },
    {
      key: 'stepCount',
      label: 'Adım Sayısı',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value, test) => (
        <StepCountCell count={test.workflow?.length || 0} />
      )
    },
    {
      key: 'createdAt',
      label: 'Oluşturulma',
      sortable: true,
      render: (value, test) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {test.createdAt ? new Date(test.createdAt).toLocaleDateString('tr-TR') : '-'}
        </span>
      )
    },
    {
      key: 'suite',
      label: 'Test Grubu',
      sortable: true,
      render: (value) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'tags',
      label: 'Etiketler',
      sortable: true,
      render: (value, test) => (
        <TagsCell tags={test.tags} maxVisible={2} />
      )
    },
    {
      key: 'browserType',
      label: 'Tarayıcı',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value, test) => (
        <BrowserCell browserType={test.browserType} />
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      sortable: false,
      align: 'right',
      width: '200px',
      render: (value, test) => (
        <ActionsCell
          onRun={() => handleRunTest(test.id)}
          onEdit={() => handleEditTest(test.id)}
          onSettings={() => handleEditTestMetadata(test.id)}
          onDuplicate={() => handleDuplicateTest(test.id)}
          onExport={() => handleExportTest(test.id)}
          onDelete={() => handleDeleteTest(test.id)}
        />
      )
    }
  ];

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
            enableScreenshots: test.enableScreenshots !== undefined ? test.enableScreenshots : browserSettings.defaultScreenshots,
            enableRecording: test.enableRecording !== undefined ? test.enableRecording : browserSettings.defaultRecording,
            headlessMode: test.headlessMode !== undefined ? test.headlessMode : browserSettings.defaultHeadless,
            browserType: test.browserType !== undefined ? test.browserType : browserSettings.defaultBrowser
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
    // Update test using hook
    updateTest(updatedTest.id, updatedTest);
    
    // Show success notification
    notifyTestImported(`${updatedTest.name} güncellendi`, '');
  };

  // Handle duplicate test
  const handleDuplicateTest = async (testId: string) => {
    try {
      const test = tests.find(t => t.id === testId);
      const duplicatedId = duplicateTest(testId);
      if (duplicatedId && test) {
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
      if (deleteTest(singleDeleteDialog.testId)) {
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
      const duplicatedCount = bulkDuplicateTests(Array.from(selectedTests));
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
      const deletedCount = bulkDeleteTests(Array.from(selectedTests));
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
              headlessMode: test.headlessMode || false,
              browserType: test.browserType || 'chromium'
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
        exportTestWorkflow(
          test.workflow, 
          `${test.name}.json`,
          {
            description: test.description,
            tags: test.tags,
            suite: test.suite,
            browserType: test.browserType,
            enableScreenshots: test.enableScreenshots,
            enableRecording: test.enableRecording,
            headlessMode: test.headlessMode
          }
        );
        notifyTestImported(`"${test.name}" başarıyla export edildi!`, testId);
      } catch (error) {
        notifyTestFailure('Export', '', 'Export işlemi sırasında hata oluştu.');
      }
    }
  };

  // Handle bulk export (selected tests)
  // Handle CSV export (selected tests)
  const handleBulkCSVExport = () => {
    if (selectedTests.size === 0) {
      notifyTestFailure('CSV Export', '', 'Export edilecek test seçin.');
      return;
    }

    const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
    exportTestsToCSV(selectedTestsData);
    notifyTestImported(`${selectedTestsData.length} test CSV olarak export edildi!`, '');
  };

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
        exportTestWorkflow(
          test.workflow, 
          `${test.name}.json`,
          {
            description: test.description,
            tags: test.tags,
            suite: test.suite,
            browserType: test.browserType,
            enableScreenshots: test.enableScreenshots,
            enableRecording: test.enableRecording,
            headlessMode: test.headlessMode
          }
        );
        notifyTestImported(`"${test.name}" başarıyla export edildi!`, test.id);
      }
    } else {
      // Multiple tests export
      const exportData = {
        version: '1.1', // Updated version to support browser settings
        exportDate: new Date().toISOString(),
        exportType: 'multiple-workflows',
        workflows: selectedTestsData.map(test => ({
          name: test.name,
          description: test.description,
          steps: test.workflow || [],
          tags: test.tags,
          suite: test.suite,
          browserType: test.browserType || 'chromium',
          enableScreenshots: test.enableScreenshots || false,
          enableRecording: test.enableRecording || false,
          headlessMode: test.headlessMode || false,
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
    refresh();
    setIsImportDialogOpen(false);
    notifyTestImported(`${importedCount} workflow`, '');
  };

  return (
    <PageLayout
      title="Kayıtlı Testler"
      subtitle={`Toplam ${tests.length} kayıtlı test bulunuyor.`}
    >
      <LoadingErrorState
        loading={loading}
        error={null}
        loadingMessage="Kaydedilen testler yükleniyor..."
        onRetry={refresh}
      >

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
                <DataFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableOptions={{
                    suites: filterOptions.suites,
                    tags: filterOptions.tags,
                    browsers: filterOptions.browsers || []
                  }}
                  searchPlaceholder="Test ara..."
                  showStatus={false}
                  showDateRange={false}
                />
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
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={X}
                      onClick={() => setSelectedTests(new Set())}
                    >
                      Temizle
                    </Button>
                    <ButtonGroup spacing="sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkRun}
                        style={{ color: '#059669', borderColor: '#059669' }}
                      >
                        Çalıştır
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Copy}
                        onClick={handleBulkDuplicate}
                        style={{ color: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        Kopyala
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        style={{ color: '#dc2626', borderColor: '#dc2626' }}
                      >
                        Sil
                      </Button>
                    </ButtonGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Download}
                      onClick={handleBulkExport}
                      style={{ color: '#2563eb', borderColor: '#2563eb' }}
                    >
                      Dışa Aktar
                    </Button>
                  </>
                )}

                <ButtonGroup spacing="sm">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={handleImport}
                  >
                    İçe Aktar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={handleCreateNewTest}
                  >
                    Yeni Test
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            {/* Separator */}
            <div style={{ 
              borderTop: '1px solid var(--border-primary)', 
              margin: '1rem 0 0 0' 
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
              <div>
                <DataTable
                  data={currentPageTests}
                  allData={filteredTests}
                  columns={columns}
                  loading={loading}
                  emptyMessage="Test bulunamadı"
                  selectable={true}
                  selectedItems={selectedTests}
                  onSelectionChange={setSelectedTests}
                  getItemId={(test) => test.id}
                  highlightedItemId={highlightedTestId}
                  onRowClick={(test) => handleEditTest(test.id)}
                  onSort={(field: string, order: 'asc' | 'desc') => {
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  sortField={sortField}
                  sortOrder={sortOrder}
                />

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
      </LoadingErrorState>

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
      <TestModal
        isOpen={editTestModal.show}
        onClose={() => setEditTestModal({show: false, test: null})}
        onSave={(data) => {
          if (editTestModal.test) {
            const updatedTest = {
              ...editTestModal.test,
              name: data.name,
              description: data.description,
              tags: data.tags,
              suite: data.suite,
              browserType: data.browserType,
              updatedAt: new Date()
            };
            
            // Update test using hook
            updateTest(editTestModal.test.id, updatedTest);
            setEditTestModal({show: false, test: null});
          }
        }}
        initialData={editTestModal.test ? {
          name: editTestModal.test.name,
          description: editTestModal.test.description,
          tags: editTestModal.test.tags,
          suite: editTestModal.test.suite,
          browserType: editTestModal.test.browserType
        } : undefined}
        mode="edit"
      />
    </PageLayout>
  );
} 