'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Copy,
  FileText,
  Download,
  Upload,
  X,
  Play,
  Trash2
} from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import DataFilters from '@/components/common/DataFilters';
import DataTable, { Column } from '@/components/common/DataTable';
import { TableCells, EditableSuiteCell, EditableTagsCell, EditableBrowserCell, PaginationControls, BulkActionsBar, EmptyState } from '@/components/common';
import ImportDialog from '@/components/test-builder/ImportDialog';
import dynamic from 'next/dynamic';

// Lazy load modals (heavy components)
const ConfirmDialog = dynamic(() => import('@/components/modals/ConfirmDialog').then(mod => ({ default: mod.default })), {
  ssr: false
});
const TestModal = dynamic(() => import('@/components/modals/TestModal').then(mod => ({ default: mod.default })), {
  ssr: false
});
import { Button, IconButton, ButtonGroup, } from '@/components';

import { Test, BrowserType } from '@/types';
import { exportTestWorkflow } from '@/utils/fileUtils';
import { useNotifications, useTests, usePagination, useSorting } from '@/hooks';
import { useBrowserSettings, useI18n } from '@/hooks';
import { ExecutionService } from '@/utils/api';
import { executeTest, executeBulkTests, validateTestForExecution, processExecutionResults } from '@/utils/testExecutionUtils';
import { getTestsTableColumns } from '@/config/tableColumns';

const { BrowserCell, TagsCell, ActionsCell, StepCountCell, TestNameCell } = TableCells;

function TestsPageContent() {
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
  const [singleDeleteDialog, setSingleDeleteDialog] = useState<{ show: boolean; testId: string; testName: string }>({
    show: false,
    testId: '',
    testName: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const { notifyTestStart, notifyTestImported, notifyTestFailure, notifyTestDeleted, notifyTestDuplicated } = useNotifications();

  // Use sorting hook
  const sorting = useSorting({
    data: filteredTests,
    defaultSortField: 'createdAt',
    defaultSortOrder: 'desc'
  });

  // Use pagination hook
  const pagination = usePagination({
    totalItems: sorting.sortedData.length,
    data: sorting.sortedData,
    itemsPerPage: 10
  });

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
      setFilters({ ...filters, search: searchQuery });
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

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters]);

  // filterOptions artık useTests hook'undan geliyor

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



  // Handle run test - Updated to use utility functions
  const handleRunTest = async (testId: string) => {
    const test = tests?.find((t: any) => t.id === testId);
    if (!test) {
      notifyTestFailure(t('tests.unknownTest'), testId, t('tests.testNotFound'));
      return;
    }

    const validation = validateTestForExecution(test);
    if (!validation.isValid) {
      notifyTestFailure(test.name, testId, validation.error || t('tests.workflowNotFound'));
      return;
    }

    try {
      const data = await executeTest(test, {}, browserSettings);
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

  // Handle bulk run - Updated to use utility functions
  const handleBulkRun = async () => {
    if (selectedTests.size === 0) return;

    const selectedTestsData = tests?.filter((test: any) => selectedTests.has(test.id)) || [];
    const validTests = selectedTestsData.filter((test: any) => test.workflow && test.workflow.length > 0);

    if (validTests.length === 0) {
      notifyTestFailure(t('tests.bulkRun'), '', t('tests.noValidWorkflows'));
      return;
    }

    try {
      const results = await executeBulkTests(validTests);
      const { executionIds, successCount, failureCount } = processExecutionResults(results);

      if (successCount > 0) {
        notifyTestStart(`${successCount} test`, executionIds.join(','));
      }

      if (failureCount > 0) {
        notifyTestFailure(t('tests.bulkRun'), '', `${failureCount} test failed to execute`);
      }

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
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

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

  // Define table columns for DataTable
  const columns: Column<Test>[] = getTestsTableColumns(t, filterOptions, {
    onUpdateSuite: handleUpdateSuite,
    onUpdateTags: handleUpdateTags,
    onUpdateBrowser: handleUpdateBrowser,
    onRun: handleRunTest,
    onEdit: handleEditTest,
    onDuplicate: handleDuplicateTest,
    onExport: handleExportTest,
    onDelete: handleDeleteTest
  });

  return (
    <PageLayout
      title={t('tests.title')}
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
                  browsers: (filterOptions.browsers || []) as BrowserType[]
                }}
                searchPlaceholder={t('tests.searchTests')}
                showStatus={false}
                showDateRange={false}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Import/Export Buttons */}
              <BulkActionsBar
                selectedCount={selectedTests.size}
                actions={[
                  {
                    id: 'run',
                    label: t('tests.runTest'),
                    icon: Play as any,
                    variant: 'outline',
                    onClick: handleBulkRun,
                    style: { color: 'var(--status-success)', borderColor: 'var(--status-success)' }
                  },
                  {
                    id: 'duplicate',
                    label: t('tests.duplicateTest'),
                    icon: Copy as any,
                    variant: 'outline',
                    onClick: handleBulkDuplicate,
                    style: { color: 'var(--status-purple)', borderColor: 'var(--status-purple)' }
                  },
                  {
                    id: 'delete',
                    label: t('common.delete'),
                    icon: Trash2 as any,
                    variant: 'outline',
                    onClick: handleBulkDelete,
                    style: { color: 'var(--status-error)', borderColor: 'var(--status-error)' }
                  },
                  {
                    id: 'export',
                    label: t('common.export'),
                    icon: Download as any,
                    variant: 'secondary',
                    onClick: handleBulkExport
                  }
                ]}
                onClearSelection={() => setSelectedTests(new Set())}
                clearButtonText={t('common.clear')}
                selectedText={t('tests.selectedTests', { count: selectedTests.size })}
              />

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
            <EmptyState
              icon={
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
              }
              title={(tests?.length || 0) === 0 ? t('filters.noWorkflowsYet') : t('filters.noTestsFound')}
              description={(tests?.length || 0) === 0
                ? t('filters.createFirstWorkflow')
                : t('filters.tryDifferentFilters')
              }
              actionButton={{
                label: t('filters.createFirstTest'),
                onClick: handleCreateNewTest,
                variant: 'cosmic',
                icon: Plus as any
              }}
            />
          ) : (
            <div>
              <DataTable
                data={pagination.currentPageItems}
                allData={sorting.sortedData}
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
                  sorting.handleSort(field);
                }}
                sortField={sorting.sortField}
                sortOrder={sorting.sortOrder}
              />

              {/* Pagination Controls */}
              <PaginationControls
                paginationInfo={pagination.paginationInfo}
                onFirstPage={pagination.goToFirstPage}
                onPreviousPage={pagination.goToPreviousPage}
                onNextPage={pagination.goToNextPage}
                onLastPage={pagination.goToLastPage}
                onPageChange={pagination.goToPage}
                itemName="test"
              />
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
        onClose={() => setSingleDeleteDialog({ show: false, testId: '', testName: '' })}
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

export default function TestsPage() {
  return (
    <Suspense fallback={<LoadingErrorState loading={true} error={null} loadingMessage="Yükleniyor..."><div></div></LoadingErrorState>}>
      <TestsPageContent />
    </Suspense>
  );
} 