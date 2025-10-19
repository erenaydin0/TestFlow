'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus,
  Copy,
  FileText,
  Download,
  Upload,
  X,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import DataFilters from '@/components/common/DataFilters';
import DataTable, { Column } from '@/components/common/DataTable';
import TableCells from '@/components/common/TableCells';
import { EditableSuiteCell, EditableTagsCell, EditableBrowserCell } from '@/components/common';
import ImportDialog from '@/components/test-builder/ImportDialog';
import { ConfirmDialog, TestModal } from '@/components/modals';
import { Button, IconButton, ButtonGroup, } from '@/components';

import { Test } from '@/types';
import { exportTestWorkflow, exportTestsToCSV } from '@/utils/fileUtils';
import { useNotifications, useTests } from '@/hooks';
import { useBrowserSettings, useI18n } from '@/contexts';
import { ExecutionService } from '@/utils/api';

const { BrowserCell, TagsCell, ActionsCell, StepCountCell, TestNameCell } = TableCells;

export default function TestsPage() {
  const browserSettings = useBrowserSettings();
  const { t } = useI18n();
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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { notifyTestStart, notifyTestImported, notifyTestFailure, notifyTestDeleted, notifyTestDuplicated } = useNotifications();

  // Handle inline updates
  const handleUpdateSuite = (testId: string, suite: string) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (test) {
      updateTest(testId, { ...test, suite });
    }
  };

  const handleUpdateTags = (testId: string, tags: string[]) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (test) {
      updateTest(testId, { ...test, tags });
    }
  };

  const handleUpdateBrowser = (testId: string, browserType: any) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (test) {
      updateTest(testId, { ...test, browserType });
    }
  };

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setFilters((prev: any) => ({ ...prev, search: searchQuery }));
    }
  }, [searchParams]);

  // Handle testId parameter to highlight specific test
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && tests && tests.length > 0) {
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
      label: t('tests.testName'),
      sortable: true,
      width: '300px',
      render: (value, test) => (
        <TestNameCell 
          name={test.name} 
          description={test.description} 
          id={test.id}
        />
      )
    },

    {
      key: 'suite',
      label: t('tests.testGroup'),
      sortable: true,
      width: '150px',
      render: (value, test) => (
        <EditableSuiteCell
          value={value}
          testId={test.id}
          availableSuites={filterOptions.suites}
          onUpdate={handleUpdateSuite}
        />
      )
    },
    {
      key: 'tags',
      label: t('tests.tags'),
      sortable: true,
      width: '200px',
      render: (value, test) => (
        <EditableTagsCell
          tags={test.tags}
          testId={test.id}
          availableTags={filterOptions.tags}
          onUpdate={handleUpdateTags}
        />
      )
    },
    {
      key: 'browserType',
      label: t('tests.browser'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <EditableBrowserCell
          browserType={test.browserType || 'chromium'}
          testId={test.id}
          onUpdate={handleUpdateBrowser}
        />
      )
    },
    {
      key: 'stepCount',
      label: t('tests.stepCount'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <StepCountCell count={test.workflow?.length || 0} />
      )
    },
    {
      key: 'createdAt',
      label: t('tests.createdAt'),
      sortable: true,
      width: '100px',
      render: (value, test) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {test.createdAt ? new Date(test.createdAt).toLocaleDateString('tr-TR') : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: t('tests.actions'),
      sortable: false,
      width: '200px',
      render: (value, test) => (
        <ActionsCell
          onRun={() => handleRunTest(test.id)}
          onEdit={() => handleEditTest(test.id)}
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

  // Handle run test - Updated to use ExecutionService
  const handleRunTest = async (testId: string) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (!test || !test.workflow || test.workflow.length === 0) {
      notifyTestFailure(test?.name || t('tests.unknownTest'), testId, t('tests.workflowNotFound'));
      return;
    }
    
    try {
      // Convert frontend steps to backend format
      const backendSteps = test.workflow.map((step: any) => ({
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
          conditionType: step.conditionType, // For IF actions
          expectedValue: step.expectedValue,
          operator: step.operator, // For IF actions
          verificationType: step.verificationType, // For verify actions
          direction: step.direction,
          amount: step.amount,
          filename: step.filename,
          key: step.key,
          optionType: step.optionType, // For dropdown actions
          optionValue: step.optionValue, // For dropdown actions
          // Connection properties for flow control
          connections: step.connections,
          trueConnection: step.trueConnection, // For IF TRUE branch
          falseConnection: step.falseConnection // For IF FALSE branch
        }
      }));
      
      const data = await ExecutionService.executeWorkflow({
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
      });

      notifyTestStart(test.name, data.executionId);
      
    } catch (error) {
      console.error('Test execution error:', error);
      notifyTestFailure(test.name, testId, error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  // Handle edit test workflow
  const handleEditTest = (testId: string) => {
    // Navigate to test builder with the workflow loaded
    router.push(`/test-builder?load=${testId}`);
  };


  // Handle duplicate test
  const handleDuplicateTest = async (testId: string) => {
    try {
      const test = tests?.find((t: any) => t.id === testId);
      const duplicatedId = await duplicateTest(testId);
      if (duplicatedId && test) {
        notifyTestDuplicated(test.name, duplicatedId);
      }
    } catch (error) {
      const test = tests?.find((t: any) => t.id === testId);
      notifyTestFailure(test?.name || t('tests.unknownTest'), testId, t('tests.duplicateError'));
    }
  };

  // Handle delete test
  const handleDeleteTest = (testId: string) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (test) {
      setSingleDeleteDialog({
        show: true,
        testId: testId,
        testName: test.name
      });
    }
  };

  const confirmSingleDelete = async () => {
    try {
      const result = await deleteTest(singleDeleteDialog.testId);
      if (result) {
        setSelectedTests(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(singleDeleteDialog.testId);
          return newSelection;
        });
        notifyTestDeleted(singleDeleteDialog.testName, singleDeleteDialog.testId);
      }
    } catch (error) {
      notifyTestFailure(singleDeleteDialog.testName, singleDeleteDialog.testId, t('tests.deleteError'));
    }
  };

  // Handle bulk duplicate
  const handleBulkDuplicate = async () => {
    if (selectedTests.size === 0) return;
    
    try {
      const duplicatedCount = await bulkDuplicateTests(Array.from(selectedTests));
      setSelectedTests(new Set());
      
      if (duplicatedCount > 0) {
        notifyTestDuplicated(`${duplicatedCount} test`, '');
      }
    } catch (error) {
      notifyTestFailure(t('tests.bulkDuplicate'), '', t('tests.bulkDuplicateError'));
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
      notifyTestFailure(t('tests.bulkDelete'), '', t('tests.bulkDeleteError'));
    }
  };

  // Handle bulk run - Updated to use ExecutionService
  const handleBulkRun = async () => {
    if (selectedTests.size === 0) return;
    
    const selectedTestsData = tests?.filter((test: any) => selectedTests.has(test.id)) || [];
    const validTests = selectedTestsData.filter((test: any) => test.workflow && test.workflow.length > 0);
    
    if (validTests.length === 0) {
      notifyTestFailure(t('tests.bulkRun'), '', t('tests.noValidWorkflows'));
      return;
    }

    try {
      const executionPromises = validTests.map(async (test: any) => {
        // Convert frontend steps to backend format
        const backendSteps = test.workflow!.map((step: any) => ({
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
        
        return await ExecutionService.executeWorkflow({
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
        });
      });

      const results = await Promise.all(executionPromises);
      const executionIds = results.map((r: any) => r.executionId);
      
      notifyTestStart(`${validTests.length} test`, executionIds.join(','));
      
    } catch (error) {
      console.error('Bulk test execution error:', error);
      notifyTestFailure(t('tests.bulkRun'), '', `${t('tests.bulkRunError')}: ${error instanceof Error ? error.message : t('common.unknownError')}. ${t('tests.checkBackend')}`);
    }
  };

  // Navigate to test builder
  const handleCreateNewTest = () => {
    router.push('/test-builder');
  };

  // Handle single test export
  const handleExportTest = (testId: string) => {
    const test = tests?.find((t: any) => t.id === testId);
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
        notifyTestImported(t('tests.exportSuccess', { name: test.name }), testId);
      } catch (error) {
        notifyTestFailure(t('tests.export'), '', t('tests.exportError'));
      }
    }
  };

  // Handle bulk export (selected tests)
  // Handle CSV export (selected tests)
  const handleBulkCSVExport = () => {
    if (selectedTests.size === 0) {
      notifyTestFailure(t('tests.csvExport'), '', t('tests.selectTestsToExport'));
      return;
    }

    const selectedTestsData = tests?.filter((test: any) => selectedTests.has(test.id)) || [];
    exportTestsToCSV(selectedTestsData);
    notifyTestImported(t('tests.csvExportSuccess', { count: selectedTestsData.length }), '');
  };

  const handleBulkExport = () => {
    if (selectedTests.size === 0) {
      notifyTestFailure(t('tests.export'), '', t('tests.selectTestsToExport'));
      return;
    }

    const selectedTestsData = tests?.filter((test: any) => selectedTests.has(test.id)) || [];
    
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
        notifyTestImported(t('tests.exportSuccess', { name: test.name }), test.id);
      }
    } else {
      // Multiple tests export
      const exportData = {
        version: '1.1', // Updated version to support browser settings
        exportDate: new Date().toISOString(),
        exportType: 'multiple-workflows',
        workflows: selectedTestsData.map((test: any) => ({
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

      notifyTestImported(t('tests.bulkExportSuccess', { count: selectedTestsData.length }), '');
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
    notifyTestImported(t('tests.importSuccess', { count: importedCount }), '');
  };

  return (
    <PageLayout
      title={t('tests.title')}
      subtitle={t('tests.subtitle', { count: tests?.length || 0 })}
    >
      <LoadingErrorState
        loading={loading}
        error={null}
        loadingMessage={t('tests.loadingTests')}
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
                  searchPlaceholder={t('tests.searchTests')}
                  showStatus={false}
                  showDateRange={false}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Import/Export Buttons */}
                {selectedTests.size > 0 && (
                  <>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {t('tests.selectedTests', { count: selectedTests.size })}
                    </span>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={X}
                      onClick={() => setSelectedTests(new Set())}
                    >
                      {t('common.clear')}
                    </Button>
                    <ButtonGroup spacing="sm">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Play}
                        onClick={handleBulkRun}
                        style={{ color: 'var(--status-success)', borderColor: 'var(--status-success)' }}
                      >
                        {t('tests.runTest')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Copy}
                        onClick={handleBulkDuplicate}
                        style={{ color: 'var(--status-purple)', borderColor: 'var(--status-purple)' }}
                      >
                        {t('tests.duplicateTest')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        onClick={handleBulkDelete}
                        style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}
                      >
                        {t('common.delete')}
                      </Button>
                    </ButtonGroup>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={handleBulkExport}
                    >
                      {t('common.export')}
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
                    {t('common.import')}
                  </Button>
                  <Button 
                    variant="cosmic"
                    icon={Plus}
                    onClick={handleCreateNewTest}
                    size="sm"
                  >
                    {t('tests.createNew')}
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
                {(tests?.length || 0) === 0 ? t('filters.noWorkflowsYet') : t('filters.noTestsFound')}
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                margin: '0 0 1.5rem 0'
              }}>
                {(tests?.length || 0) === 0 
                  ? t('filters.createFirstWorkflow')
                  : t('filters.tryDifferentFilters')
                }
              </p>
              <Button 
                onClick={handleCreateNewTest}
                variant="cosmic"
                icon={Plus}
                size="sm"
                style={{ margin: '0 auto' }}
              >
                {t('filters.createFirstTest')}
              </Button>
              </div>
            ) : (
              <div>
                <DataTable
                  data={currentPageTests}
                  allData={filteredTests}
                  columns={columns}
                  loading={loading}
                  emptyMessage={t('tests.noTestsFound')}
                  selectable={true}
                  selectedItems={selectedTests}
                  onSelectionChange={setSelectedTests}
                  getItemId={(test) => test.id}
                  highlightedItemId={highlightedTestId}
                  onRowDoubleClick={(test) => handleEditTest(test.id)}
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
                    <IconButton
                      icon={ChevronsLeft}
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      tooltip={t('common.firstPage')}
                      style={{ width: '2rem', height: '2rem' }}
                    />

                    <IconButton
                      icon={ChevronLeft}
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      tooltip={t('common.previousPage')}
                      style={{ width: '2rem', height: '2rem' }}
                    />

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
                            <Button
                              key={i}
                              onClick={() => goToPage(i)}
                              variant={i === currentPage ? 'primary' : 'outline'}
                              size="sm"
                              style={{ 
                                width: '2rem', 
                                height: '2rem',
                                minWidth: '2rem',
                                padding: '0'
                              }}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <IconButton
                      icon={ChevronRight}
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      tooltip="Sonraki sayfa"
                      style={{ width: '2rem', height: '2rem' }}
                    />

                    <IconButton
                      icon={ChevronsRight}
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      tooltip="Son sayfa"
                      style={{ width: '2rem', height: '2rem' }}
                    />
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
        title={t('confirmDialog.deleteTests')}
        message={t('confirmDialog.deleteTestsMessage', { count: selectedTests.size })}
        confirmText={t('confirmDialog.delete')}
        cancelText={t('confirmDialog.cancel')}
        type="danger"
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={singleDeleteDialog.show}
        onClose={() => setSingleDeleteDialog({show: false, testId: '', testName: ''})}
        onConfirm={confirmSingleDelete}
        title={t('confirmDialog.deleteTest')}
        message={t('confirmDialog.deleteTestMessage', { testName: singleDeleteDialog.testName })}
        confirmText={t('confirmDialog.delete')}
        cancelText={t('confirmDialog.cancel')}
        type="danger"
      />

    </PageLayout>
  );
} 