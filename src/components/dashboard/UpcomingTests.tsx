'use client';

import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScheduledTest } from '@/types/test';
import { getScheduleDescription } from '@/utils/utils';
import { useI18n } from '@/hooks';

interface UpcomingTestsProps {
  scheduledTests: ScheduledTest[];
  loading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onTestClick?: (schedule: ScheduledTest) => void;
}

function UpcomingTests({
  scheduledTests,
  loading = false,
  maxItems = 5,
  showViewAll = true,
  onTestClick
}: UpcomingTestsProps) {
  const router = useRouter();
  const { t } = useI18n();

  // Aktif zamanlamaları nextRun'a göre sırala ve limitle
  const upcoming = scheduledTests
    .filter(s => s.enabled && s.status === 'active' && s.nextRun)
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
    .slice(0, maxItems);

  const handleViewAll = () => {
    router.push('/scheduled');
  };

  const handleTestClick = (schedule: ScheduledTest) => {
    if (onTestClick) {
      onTestClick(schedule);
    } else {
      router.push('/scheduled');
    }
  };

  if (loading) {
    return (
      <div className="card h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.upcomingTests')}
          </h3>
        </div>
        <div className="text-center py-8 flex-1 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.upcomingTests')}
        </h3>

        {showViewAll && upcoming.length > 0 && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
            style={{
              color: 'var(--accent-primary)',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
          >
            {t('dashboard.viewAll')}
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-8 flex-1 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
          <div style={{ textAlign: 'center' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.875rem', margin: 0 }}>{t('dashboard.noUpcomingTests')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {upcoming.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-all duration-200 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
              onClick={() => handleTestClick(schedule)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                    title={schedule.name}
                  >
                    {schedule.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} color="var(--text-tertiary)" />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString(t('common.locale') === 'tr' ? 'tr-TR' : 'en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p
                  className="text-xs truncate max-w-[80px]"
                  style={{ color: 'var(--text-tertiary)' }}
                  title={schedule.suite}
                >
                  {schedule.suite}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {getScheduleDescription(schedule.schedule, t)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(UpcomingTests);
