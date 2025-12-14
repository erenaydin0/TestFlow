'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Download,
  Image,
  Video,
  RefreshCw,
  X,
  Trash2,
  AlertCircle,
  FileText,
  Tag
} from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import DataFilters from '@/components/common/DataFilters';
import DataTable, { Column } from '@/components/common/DataTable';
import { TableCells, StatusBadge } from '@/components/common';
import { StatsCards } from '@/components/dashboard';
import { StepView } from '@/components/reports';
import dynamic from 'next/dynamic';

// Lazy load ConfirmDialog (heavy component)
const ConfirmDialog = dynamic(() => import('@/components/modals/ConfirmDialog'), {
  ssr: false
});
import { Button, IconButton, ButtonGroup, PaginationControls, BulkActionsBar } from '@/components';

import { ExecutionResult, BrowserType } from '@/types';
import { formatDuration, formatRelativeTime, formatDateForTooltip } from '@/utils/dateUtils';
import { useNotifications, useReports, usePagination } from '@/hooks';
import { useSidebar, useI18n } from '@/hooks';
import { API_URL } from '@/utils/config';
import { downloadExecutionReport, downloadBulkExecutionReports } from '@/utils/reportUtils';
import { getReportsTableColumns } from '@/config/tableColumns';

const { BrowserCell, TagsCell, ActionsCell, StatusCell, DurationCell, TestNameCell, SuccessRateCell } = TableCells;

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate' | 'suite' | 'tags' | 'browserType';

function ReportsPageContent() {
  const { setIsModalOpen } = useSidebar();
  const { t, locale } = useI18n();
  const {
    executions,
    filteredExecutions,
    sortedExecutions,
    loading,
    error,
    stats,
    filteredStats,
    filters,
    setFilters,
    filterOptions,
    hasActiveFilters,
    clearFilters,
    sortField,
    sortOrder,
    handleSort,
    selectedExecutions,
    setSelectedExecutions,
    refresh,
    deleteExecution,
    bulkDeleteExecutions
  } = useReports();

  const [selectedExecution, setSelectedExecution] = useState<ExecutionResult | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { notifyTestDeleted, notifyTestFailure } = useNotifications();

  const [highlightedExecutionId, setHighlightedExecutionId] = useState<string | null>(null);

  // Use pagination hook
  const pagination = usePagination({
    totalItems: sortedExecutions.length,
    data: sortedExecutions,
    itemsPerPage: 10
  });

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const suiteParam = searchParams.get('suite');
    const browserParam = searchParams.get('browser');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (searchQuery || suiteParam || browserParam || dateParam || startDateParam || endDateParam) {
      setFilters(prev => ({
        ...prev,
        ...(searchQuery && { search: searchQuery }),
        ...(suiteParam && { suite: [suiteParam] }),
        ...(browserParam && { browserType: [browserParam as BrowserType] }),
        ...(dateParam && { specificDate: dateParam, dateRange: '', startDate: '', endDate: '' }), // Tek tarih
        ...(startDateParam && endDateParam && {
          startDate: startDateParam,
          endDate: endDateParam,
          specificDate: '',
          dateRange: ''
        }) // Tarih aralığı
      }));
    }
  }, [searchParams]);

  // Handle execution ID parameter to open details modal
  useEffect(() => {
    const executionId = searchParams.get('executionId');
    if (executionId && executions && executions.length > 0) {
      const execution = executions.find(e => e.id === executionId);
      if (execution) {
        setSelectedExecution(execution);
      }
    }
  }, [searchParams, executions]);

  // Handle test ID parameter to find and open related execution modal
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && executions && executions.length > 0) {
      console.log(t('reports.lookingForTestId'), testId);
      console.log(t('reports.availableExecutions'), executions.map(e => ({ id: e.id, workflowId: e.workflowId, workflowName: e.workflowName })));

      // Test ID'sine göre en son execution'ı bulalım - daha geniş filtreleme
      const testExecutions = executions.filter(e =>
        e.workflowId === testId ||
        e.workflowName.toLowerCase().includes(testId.toLowerCase()) ||
        e.id.includes(testId)
      );

      console.log('Matching executions:', testExecutions);

      if (testExecutions.length > 0) {
        // En son çalıştırılan execution'ı seç
        const latestExecution = testExecutions.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];
        console.log(t('reports.selectedExecution'), latestExecution);
        setSelectedExecution(latestExecution);
      } else {
        // Eğer testId ile eşleşen bir execution bulunamadıysa, en son execution'ı seç
        console.log(t('reports.noMatchingExecutions'));
        const latestExecution = executions!.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];
        if (latestExecution) {
          console.log(t('reports.selectedLatestExecution'), latestExecution);
          setSelectedExecution(latestExecution);
        }
      }
    }
  }, [searchParams, executions]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedExecution) {
        setSelectedExecution(null);
      }
    };

    if (selectedExecution) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedExecution]);

  // Update sidebar state when modal opens/closes
  useEffect(() => {
    setIsModalOpen(!!selectedExecution);
  }, [selectedExecution, setIsModalOpen]);

  // Define table columns for DataTable - will be defined after downloadSingleExecution function

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters, sortField, sortOrder]);

  // Handle row click for execution details
  const handleRowClick = (execution: ExecutionResult) => {
    setSelectedExecution(execution);
  };

  // Helper functions removed - now using utility functions

  // Single execution download - now using utility function
  const downloadSingleExecution = async (execution: ExecutionResult) => {
    try {
      await downloadExecutionReport(execution, t);
    } catch (error) {
      console.error('Error creating report package:', error);
      notifyTestFailure('Single Download', '', error instanceof Error ? error.message : t('common.unknownError'));
    }
  };

  // Define table columns for DataTable
  const columns: Column<ExecutionResult>[] = getReportsTableColumns(t, locale, {
    onDownload: downloadSingleExecution
  });


  const downloadSelectedTests = async () => {
    if (selectedExecutions.size === 0) return;

    try {
      const selectedExecutionsList = sortedExecutions.filter((e: ExecutionResult) => selectedExecutions.has(e.id));
      await downloadBulkExecutionReports(selectedExecutionsList, t);

      // Clear selection
      setSelectedExecutions(new Set());

    } catch (error) {
      console.error('Error creating bulk report package:', error);
      notifyTestFailure('Bulk Download', '', error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  };

  const deleteSelectedTests = async () => {
    if (selectedExecutions.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletedCount = await bulkDeleteExecutions(Array.from(selectedExecutions));

      // Clear selection
      setSelectedExecutions(new Set());

      // Close dialog
      setShowBulkDeleteDialog(false);

      notifyTestDeleted(`${deletedCount} test kaydı`, '');
    } catch (error: any) {
      console.error('Error deleting tests:', error);
      notifyTestFailure('Bulk Delete', '', 'Testler silinirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  return (
    <PageLayout
      title={t('reports.title')}
    >
      <LoadingErrorState
        loading={loading}
        error={error}
        loadingMessage={t('reports.loadingResults')}
        onRetry={refresh}
      >
        {/* Stats Overview */}
        <StatsCards stats={filteredStats} loading={loading} />

        {/* Executions List */}
        <div className="card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <DataFilters
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);

                  // URL'i güncelle
                  const params = new URLSearchParams();
                  if (newFilters.search) params.set('search', newFilters.search);
                  if (newFilters.status) params.set('status', newFilters.status);
                  if (newFilters.suite.length > 0) params.set('suite', newFilters.suite.join(','));
                  if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
                  if (newFilters.browserType.length > 0) params.set('browser', newFilters.browserType.join(','));
                  if (newFilters.startDate && newFilters.endDate) {
                    params.set('startDate', newFilters.startDate);
                    params.set('endDate', newFilters.endDate);
                  } else if (newFilters.specificDate) {
                    params.set('date', newFilters.specificDate);
                  }

                  const queryString = params.toString();
                  router.push(queryString ? `/reports?${queryString}` : '/reports', { scroll: false });
                }}
                availableOptions={{
                  suites: filterOptions.suites,
                  tags: filterOptions.tags,
                  browsers: filterOptions.browsers,
                  statuses: filterOptions.statuses
                }}
                searchPlaceholder={t('reports.searchPlaceholder')}
                showStatus={true}
                showDateRange={true}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <BulkActionsBar
                selectedCount={selectedExecutions.size}
                actions={[
                  {
                    id: 'download',
                    label: t('bulkActions.downloadSelected'),
                    icon: Download as any,
                    variant: 'success',
                    onClick: downloadSelectedTests
                  },
                  {
                    id: 'delete',
                    label: t('bulkActions.delete'),
                    icon: Trash2 as any,
                    variant: 'danger',
                    onClick: deleteSelectedTests
                  }
                ]}
                onClearSelection={() => setSelectedExecutions(new Set())}
                clearButtonText={t('bulkActions.clearSelection')}
                selectedText={t('bulkActions.testsSelected', { count: selectedExecutions.size })}
              />
            </div>
          </div>

          {/* Old filters section removed - now using DataFilters component above */}

          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem'
            }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ marginLeft: '0.5rem' }}>Yükleniyor...</span>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem',
              color: 'var(--status-error)'
            }}>
              <AlertCircle size={24} />
              <span style={{ marginLeft: '0.5rem' }}>Hata: {error}</span>
            </div>
          ) : sortedExecutions.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)'
            }}>
              <FileText size={24} />
              <span style={{ marginLeft: '0.5rem' }}>
                {hasActiveFilters ? t('filters.noResultsFound') : t('dashboard.noTestsRun')}
              </span>
            </div>
          ) : (
            <div>
              <DataTable
                data={pagination.currentPageItems}
                allData={sortedExecutions}
                columns={columns}
                loading={loading}
                emptyMessage={t('reports.noResults')}
                selectable={true}
                selectedItems={selectedExecutions}
                onSelectionChange={setSelectedExecutions}
                getItemId={(execution) => execution.id}
                highlightedItemId={highlightedExecutionId}
                onSort={(field: string, order: 'asc' | 'desc') => {
                  handleSort(field as SortField);
                }}
                sortField={sortField}
                sortOrder={sortOrder}
                onRowClick={handleRowClick}
              />

              {/* Pagination Controls */}
              <PaginationControls
                paginationInfo={pagination.paginationInfo}
                onFirstPage={pagination.goToFirstPage}
                onPreviousPage={pagination.goToPreviousPage}
                onNextPage={pagination.goToNextPage}
                onLastPage={pagination.goToLastPage}
                onPageChange={pagination.goToPage}
                itemName="sonuç"
              />
            </div>
          )}
        </div>

        {/* Execution Details Modal */}
        {selectedExecution && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            onClick={() => setSelectedExecution(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '95%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem'
              }}>
                <div style={{ flex: 1 }}>
                  {/* Test Adı, StatusBadge, Başarı Oranı */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.75rem'
                  }}>
                    <h3 style={{
                      margin: 0,
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem',
                      fontWeight: 600
                    }}>
                      {selectedExecution.workflowName}
                    </h3>
                    <StatusBadge status={selectedExecution.status} size="md" />
                    {selectedExecution.successRate !== undefined && (
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: selectedExecution.successRate >= 80 ? 'var(--status-success)' : selectedExecution.successRate >= 50 ? 'var(--status-warning)' : 'var(--status-error)'
                      }}>
                        {selectedExecution.successRate}%
                      </span>
                    )}
                  </div>

                  {/* ID */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace'
                    }}>
                      {t('reports.id')}: {selectedExecution.id}
                    </span>
                  </div>

                  {/* Başlangıç, Bitiş, Süre */}
                  <div style={{
                    display: 'flex',
                    gap: '2rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div>
                      <strong>{t('reports.startTime')}:</strong> {new Date(selectedExecution.startTime).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    {selectedExecution.endTime && (
                      <div>
                        <strong>{t('reports.endTime')}:</strong> {new Date(selectedExecution.endTime).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    )}
                    {selectedExecution.duration && (
                      <div>
                        <strong>{t('common.duration')}:</strong> {formatDuration(selectedExecution.duration)}
                      </div>
                    )}
                  </div>

                  {/* Test Metadata */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {/* Browser */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>{t('reports.browser')}:</strong>
                      {(() => {
                        const browserType = selectedExecution.options?.browserType || 'chromium';
                        const getBrowserName = () => {
                          switch (browserType) {
                            case 'chromium': return 'Chrome';
                            case 'firefox': return 'Firefox';
                            case 'webkit': return 'Safari';
                            case 'msedge': return 'Edge';
                            default: return 'Chrome';
                          }
                        };
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>{getBrowserName()}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Suite */}
                    {selectedExecution.suite && (
                      <div>
                        <strong>{t('reports.testGroup')}:</strong> {selectedExecution.suite}
                      </div>
                    )}

                    {/* Tags */}
                    {selectedExecution.tags && selectedExecution.tags.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong>{t('reports.tags')}:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {selectedExecution.tags.map((tag, index) => (
                            <span
                              key={index}
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
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Options */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {selectedExecution.options?.headlessMode && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border-secondary)'
                        }}>
                          Headless
                        </span>
                      )}
                      {selectedExecution.options?.enableScreenshots && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: 'var(--status-success-bg)',
                          color: 'var(--status-success)',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--status-success)'
                        }}>
                          <Image size={10} />
                          Screenshots
                        </span>
                      )}
                      {selectedExecution.options?.enableRecording && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: 'var(--status-error-bg)',
                          color: 'var(--status-error)',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--status-error)'
                        }}>
                          <Video size={10} />
                          Recording
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ButtonGroup spacing="sm">
                  <IconButton
                    icon={Download}
                    variant="ghost"
                    size="md"
                    tooltip={t('reports.downloadReport')}
                    onClick={() => downloadSingleExecution(selectedExecution)}
                  />
                  <IconButton
                    icon={X}
                    variant="ghost"
                    size="md"
                    tooltip="Kapat"
                    onClick={() => setSelectedExecution(null)}
                  />
                </ButtonGroup>
              </div>

              {/* Unified Step View */}
              <StepView
                steps={selectedExecution.steps}
              />

              {/* Screenshots and Video */}
              {(selectedExecution.screenshots.length > 0 || selectedExecution.videoPath) && (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Video butonu başta */}
                    {selectedExecution.videoPath && (
                      <a
                        href={`${API_URL}${selectedExecution.videoPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--status-error-bg)',
                          color: 'var(--status-error)',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          border: '1px solid var(--status-error)',
                          fontWeight: 500
                        }}
                      >
                        <Video size={16} />
                        Video Kaydını İzle
                      </a>
                    )}
                    {/* Screenshot butonları */}
                    {selectedExecution.screenshots.map((screenshot, index) => (
                      <a
                        key={index}
                        href={`${API_URL}${screenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--status-purple-bg)',
                          color: 'var(--status-purple)',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          border: '1px solid var(--status-purple)',
                          fontWeight: 500
                        }}
                      >
                        <Image size={16} />
                        Screenshot {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </LoadingErrorState>

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title={t('reports.deleteRecords')}
        message={t('reports.deleteConfirm', { count: selectedExecutions.size })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </PageLayout>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<LoadingErrorState loading={true} error={null} loadingMessage="Yükleniyor..."><div></div></LoadingErrorState>}>
      <ReportsPageContent />
    </Suspense>
  );
}
