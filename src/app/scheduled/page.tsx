'use client';

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  Calendar
} from 'lucide-react';

import { PageLayout } from '@/components/layout';
import { StatusBadge, CustomSelect, LoadingErrorState, Button, IconButton } from '@/components/common';
import { ScheduleModal, ConfirmDialog } from '@/components/modals';
import { UpcomingTests } from '@/components/dashboard';
import { formatDuration, formatRelativeTime, getScheduleDescription, formatDateForTooltip } from '@/utils/utils';
import { useScheduledTests } from '@/hooks';
import { ScheduledTest } from '@/types/test';
import { useI18n } from '@/contexts';

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
  
  return (
    <PageLayout
      title={t('scheduled.title')}
      subtitle={
        scheduledTests.length > 0 
          ? `${t('scheduled.subtitle')} (${filteredTests.length} / ${scheduledTests.length} ${t('scheduled.tests')})`
          : t('scheduled.subtitle')
      }
      headerActions={
        <Button 
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingSchedule(undefined);
            setIsModalOpen(true);
          }}
          size="sm"
        >
          {t('scheduled.createNewSchedule')}
        </Button>
      }
    >
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1.5rem' ,  
        width: '120px'
        }}>
          <CustomSelect 
          value={filters.status[0] || ''}
          onChange={(value) => setFilters({ ...filters, status: value ? [value as any] : [] })}
          style={{
            width: 'max-content'
          }}
          options={[
            { value: 'active', label: t('status.active') },
            { value: 'paused', label: t('status.paused') },
          ]}
          placeholder={t('common.allStatuses')}
        />
      </div>

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
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  margin: '0 0 1rem 0'
                }}>
                  {t('scheduled.allSchedules')}
                </h3>
                
                {filteredTests.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>{t('scheduled.noSchedulesFound')}</p>
                    <Button 
                      variant="primary"
                      onClick={() => setIsModalOpen(true)}
                      size="sm"
                      style={{ marginTop: '1rem' }}
                    >
                      {t('scheduled.createFirstSchedule')}
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredTests.map((test) => (
                  <div 
                    key={test.id} 
                    className="card"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h4 style={{ 
                            fontSize: '1rem', 
                            fontWeight: 600, 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {test.name}
                          </h4>
                          <StatusBadge status={test.status} />
                        </div>
                        
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)',
                          margin: '0 0 0.75rem 0'
                        }}>
                          {test.description}
                        </p>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: '1rem' 
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <Clock size={14} color="var(--text-tertiary)" />
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {t('scheduled.schedule')}
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--text-primary)',
                              margin: 0,
                              fontWeight: 500
                            }}>
                              {getScheduleDescription(test.schedule, t)}
                            </p>
                          </div>
                          
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <Calendar size={14} color="var(--text-tertiary)" />
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {t('scheduled.nextRun')}
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--text-primary)',
                              margin: 0,
                              fontWeight: 500
                            }}>
                              {test.nextRun ? new Date(test.nextRun).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {test.status === 'active' ? (
                          <IconButton 
                            icon={Pause}
                            onClick={() => toggleSchedule(test.id)}
                            variant="ghost"
                            size="sm"
                            style={{ color: 'var(--status-warning)' }}
                          />
                        ) : (
                          <IconButton 
                            icon={Play}
                            onClick={() => toggleSchedule(test.id)}
                            variant="ghost"
                            size="sm"
                            style={{ color: 'var(--status-success)' }}
                          />
                        )}
                        
                        <IconButton 
                          icon={Edit}
                          onClick={() => {
                            setEditingSchedule(test);
                            setIsModalOpen(true);
                          }}
                          variant="ghost"
                          size="sm"
                          tooltip={t('common.edit')}
                        />
                        
                        <IconButton 
                          icon={Trash2}
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              schedule: test
                            });
                          }}
                          variant="ghost"
                          size="sm"
                          tooltip={t('common.delete')}
                          style={{ color: 'var(--status-error)' }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-primary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          <span>{t('scheduled.lastRun')}: </span>
                          <span 
                            style={{ color: 'var(--text-secondary)' }}
                            title={formatDateForTooltip(test.lastRun, locale)}
                          >
                            {formatRelativeTime(test.lastRun, t)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          <span>{t('common.duration')}: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {formatDuration(test.lastDuration || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {t('scheduled.successRate')}:
                        </span>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          color: (test.successRate || 0) >= 95 ? 'var(--status-success)' : (test.successRate || 0) >= 85 ? 'var(--status-warning)' : 'var(--status-error)'
                        }}>
                          {test.successRate || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                    ))}
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