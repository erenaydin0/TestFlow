'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';

import { PageLayout } from '@/components/layout';
import { StatusBadge, CustomSelect, LoadingErrorState, Button, IconButton, DataTable, DataFilters } from '@/components/common';
import { Column } from '@/components/common/DataTable';
import { ScheduleModal, ConfirmDialog } from '@/components/modals';
import { UpcomingTests } from '@/components/dashboard';
import { formatDuration, formatRelativeTime, getScheduleDescription, formatDateForTooltip } from '@/utils/utils';
import { useScheduledTests } from '@/hooks';
import { ScheduledTest } from '@/types/test';
import { useI18n } from '@/contexts';
import TableCells from '@/components/common/TableCells';

const { TestNameCell, StatusCell, ScheduleCell, NextRunCell, ScheduledActionsCell } = TableCells;

export default function ScheduledPage() {
  const { t, locale } = useI18n();
  const { 
    scheduledTests, 
    upcomingRuns, 
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('nextRun');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Sort schedules
  const sortedSchedules = useMemo(() => {
    const sorted = [...filteredTests];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'schedule':
          aValue = a.schedule;
          bValue = b.schedule;
          break;
        case 'nextRun':
          aValue = a.nextRun ? new Date(a.nextRun).getTime() : 0;
          bValue = b.nextRun ? new Date(b.nextRun).getTime() : 0;
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
  const totalItems = sortedSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageSchedules = sortedSchedules.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
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
      subtitle={
        scheduledTests.length > 0 
          ? `${t('scheduled.subtitle')} (${filteredTests.length} / ${scheduledTests.length} ${t('scheduled.tests')})`
          : t('scheduled.subtitle')
      }
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
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>{t('scheduled.noSchedulesFound')}</p>
                    <Button 
                      variant="cosmic"
                      onClick={() => setIsModalOpen(true)}
                      size="sm"
                      style={{ marginTop: '1rem' }}
                    >
                      {t('scheduled.createFirstSchedule')}
                    </Button>
                  </div>
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
                        {selectedSchedules.size > 0 && (
                          <>
                            <span style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--text-secondary)' 
                            }}>
                              {selectedSchedules.size} seçili
                            </span>
                            
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={X}
                              onClick={() => setSelectedSchedules(new Set())}
                            >
                              {t('common.clear')}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Pause}
                              onClick={handleBulkToggle}
                              style={{ 
                                color: 'var(--status-warning)', 
                                borderColor: 'var(--status-warning)' 
                              }}
                            >
                              {t('scheduled.toggleAll')}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Trash2}
                              onClick={handleBulkDelete}
                              style={{ 
                                color: 'var(--status-error)', 
                                borderColor: 'var(--status-error)' 
                              }}
                            >
                              {t('common.delete')}
                            </Button>
                          </>
                        )}
                        
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
                      data={currentPageSchedules}
                      allData={filteredTests}
                      columns={columns}
                      loading={loading}
                      emptyMessage={t('scheduled.noTestsFound')}
                      selectable={true}
                      selectedItems={selectedSchedules}
                      onSelectionChange={setSelectedSchedules}
                      getItemId={(schedule) => schedule.id}
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
                              <span>{totalItems} toplam zamanlama</span>
                            </>
                          ) : (
                            'Zamanlama bulunamadı'
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
                            tooltip={t('common.nextPage')}
                            style={{ width: '2rem', height: '2rem' }}
                          />

                          <IconButton
                            icon={ChevronsRight}
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                            tooltip={t('common.lastPage')}
                            style={{ width: '2rem', height: '2rem' }}
                          />
                        </div>
                      </div>
                    )}
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