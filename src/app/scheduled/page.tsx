'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  X
} from 'lucide-react';

import { PageLayout } from '@/components/layout';
import { StatusBadge, CustomSelect, LoadingErrorState, Button, IconButton, DataTable, DataFilters, PaginationControls, BulkActionsBar, EmptyState, TableCells } from '@/components/common';
import { Column } from '@/components/common/DataTable';
import dynamic from 'next/dynamic';

// Lazy load modals (heavy components)
const ScheduleModal = dynamic(() => import('@/components/modals/ScheduleModal').then(mod => ({ default: mod.ScheduleModal })), {
  ssr: false
});
const ConfirmDialog = dynamic(() => import('@/components/modals/ConfirmDialog').then(mod => ({ default: mod.default })), {
  ssr: false
});
import { UpcomingTests } from '@/components/dashboard';
import { getScheduleDescription } from '@/utils/utils';
import { useScheduledTests, usePagination, useSorting } from '@/hooks';
import { ScheduledTest } from '@/types/test';
import { useI18n } from '@/hooks';

const { TestNameCell, StatusCell, ScheduleCell, NextRunCell, ScheduledActionsCell } = TableCells;

export default function ScheduledPage() {
  const { t, locale } = useI18n();
  const { 
    scheduledTests, 
    loading, 
    error,
    filters,
    setFilters,
    filteredTests,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule
  } = useScheduledTests();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledTest | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    schedule: ScheduledTest | null;
  }>({
    isOpen: false,
    schedule: null
  });
  
  // Selection state
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  
  // Use sorting hook
  const sorting = useSorting({
    data: filteredTests,
    defaultSortField: 'nextRun',
    defaultSortOrder: 'asc'
  });

  // Use pagination hook
  const pagination = usePagination({
    totalItems: sorting.sortedData.length,
    data: sorting.sortedData,
    itemsPerPage: 10
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [filters]);

  // Define table columns
  const columns: Column<ScheduledTest>[] = [
    {
      key: 'name',
      label: t('scheduled.testName'),
      sortable: true,
      width: '300px',
      render: (value: any, schedule: ScheduledTest) => (
        <TestNameCell 
          name={schedule.name} 
          description={schedule.description} 
          id={schedule.id}
        />
      )
    },
    {
      key: 'status',
      label: t('scheduled.status'),
      sortable: true,
      width: '120px',
      render: (value: any, schedule: ScheduledTest) => (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: schedule.status === 'active' ? 'var(--status-success)' : 'var(--status-error)',
        }}>
          {schedule.status === 'active' ? t('scheduled.active') : t('scheduled.inactive')}
        </div>
      )
    },
    {
      key: 'schedule',
      label: t('scheduled.schedule'),
      sortable: true,
      width: '200px',
      render: (value: any, schedule: ScheduledTest) => (
        <ScheduleCell 
          schedule={schedule.schedule}
          description={getScheduleDescription(schedule.schedule, t)}
        />
      )
    },
    {
      key: 'nextRun',
      label: t('scheduled.nextRun'),
      sortable: true,
      width: '200px',
      render: (value: any, schedule: ScheduledTest) => (
        <NextRunCell nextRun={schedule.nextRun} />
      )
    },
    {
      key: 'actions',
      label: t('scheduled.actions'),
      sortable: false,
      width: '150px',
      render: (value: any, schedule: ScheduledTest) => (
        <ScheduledActionsCell
          onToggle={() => toggleSchedule(schedule.id)}
          onEdit={() => {
            setEditingSchedule(schedule);
            setIsModalOpen(true);
          }}
          onDelete={() => {
            setDeleteConfirm({
              isOpen: true,
              schedule: schedule
            });
          }}
          status={schedule.status === 'active' ? 'active' : 'inactive'}
        />
      )
    }
  ];


  // Bulk operations
  const handleBulkToggle = () => {
    selectedSchedules.forEach(id => {
      toggleSchedule(id);
    });
    setSelectedSchedules(new Set());
  };

  const handleBulkDelete = () => {
    selectedSchedules.forEach(id => {
      deleteSchedule(id);
    });
    setSelectedSchedules(new Set());
  };
  
  return (
    <PageLayout
      title={t('scheduled.title')}
    >

      {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingErrorState loading={loading} error={error} children={<></>} />
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ color: 'var(--status-error)', marginBottom: '1rem' }}>{error}</p>
              <Button 
                variant="primary"
                onClick={() => window.location.reload()}
                size="sm"
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr', 
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              {/* Scheduled Tests */}
              <div className="card">
                
                {filteredTests.length === 0 ? (
                  <EmptyState
                    icon={<Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />}
                    title={t('scheduled.noSchedulesFound')}
                    actionButton={{
                      label: t('scheduled.createFirstSchedule'),
                      onClick: () => setIsModalOpen(true),
                      variant: 'cosmic'
                    }}
                  />
                ) : (
                  <div>
                    {/* Filters */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder={t('scheduled.searchSchedules')}
                            value={filters.search || ''}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            style={{
                              padding: '0.375rem',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '0.375rem',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.75rem',
                              minWidth: '200px'
                            }}
                          />
                          <CustomSelect 
                            value={filters.status[0] || ''}
                            onChange={(value) => setFilters({ ...filters, status: value ? [value as any] : [] })}
                            style={{ width: 'max-content' }}
                            options={[
                              { value: 'active', label: t('scheduled.active') },
                              { value: 'paused', label: t('scheduled.inactive') },
                            ]}
                            placeholder={t('common.allStatuses')}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Bulk Actions */}
                        <BulkActionsBar
                          selectedCount={selectedSchedules.size}
                          actions={[
                            {
                              id: 'toggle',
                              label: t('scheduled.toggleAll'),
                              icon: Pause as any,
                              variant: 'outline',
                              onClick: handleBulkToggle,
                              style: { 
                                color: 'var(--status-warning)', 
                                borderColor: 'var(--status-warning)' 
                              }
                            },
                            {
                              id: 'delete',
                              label: t('common.delete'),
                              icon: Trash2 as any,
                              variant: 'outline',
                              onClick: handleBulkDelete,
                              style: { 
                                color: 'var(--status-error)', 
                                borderColor: 'var(--status-error)' 
                              }
                            }
                          ]}
                          onClearSelection={() => setSelectedSchedules(new Set())}
                          clearButtonText={t('common.clear')}
                          selectedText={`${selectedSchedules.size} seçili`}
                        />
                        
                        <Button 
                          variant="cosmic"
                          icon={Plus}
                          onClick={() => setIsModalOpen(true)}
                          size="sm"
                        >
                          {t('scheduled.createNewSchedule')}
                        </Button>
                      </div>
                    </div>

                    {/* Separator */}
                    <div style={{ 
                      borderTop: '1px solid var(--border-primary)', 
                      margin: '0 0 1rem 0' 
                    }}></div>


                    {/* Data Table */}
                    <DataTable
                      data={pagination.currentPageItems}
                      allData={sorting.sortedData}
                      columns={columns}
                      loading={loading}
                      emptyMessage={t('scheduled.noTestsFound')}
                      selectable={true}
                      selectedItems={selectedSchedules}
                      onSelectionChange={setSelectedSchedules}
                      getItemId={(schedule) => schedule.id}
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
                      itemName="zamanlama"
                    />
                  </div>
                )}
              </div>

              {/* Upcoming Runs */}
              <div>
                <UpcomingTests 
                  scheduledTests={scheduledTests}
                  loading={loading}
                  maxItems={5}
                  showViewAll={false}
                  onTestClick={(schedule) => {
                    setEditingSchedule(schedule);
                    setIsModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}
      
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(undefined);
        }}
        onSave={async (schedule) => {
          if (editingSchedule) {
            await updateSchedule(editingSchedule.id, schedule);
          } else {
            await createSchedule(schedule);
          }
        }}
        schedule={editingSchedule}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, schedule: null })}
        onConfirm={async () => {
          if (deleteConfirm.schedule) {
            await deleteSchedule(deleteConfirm.schedule.id);
            setDeleteConfirm({ isOpen: false, schedule: null });
          }
        }}
        title={t('scheduled.deleteTitle')}
        message={t('scheduled.deleteMessage', { name: deleteConfirm.schedule?.name })}
        confirmText={t('scheduled.deleteConfirm')}
        cancelText={t('scheduled.cancel')}
        type="danger"
      />
    </PageLayout>
  );
} 