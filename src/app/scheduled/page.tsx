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
import { StatusBadge, CosmicSpinner } from '@/components/common';
import { ScheduleModal } from '@/components/modals';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { useScheduledTests } from '@/hooks/data';
import { ScheduledTest } from '@/types/test';

function getScheduleDescription(schedule: string): string {
  const scheduleMap: { [key: string]: string } = {
    '0 9 * * *': 'Her gün 09:00',
    '0 2 * * 1': 'Her Pazartesi 02:00',
    '0 * * * *': 'Her saat başı',
    '0 0 1 * *': 'Her ayın 1\'inde 00:00',
    '0 */6 * * *': 'Her 6 saatte bir',
    '0 0 * * *': 'Her gün 00:00',
    '0 12 * * *': 'Her gün 12:00'
  };
  return scheduleMap[schedule] || schedule;
}

export default function ScheduledPage() {
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
  
  return (
    <PageLayout
      title="Zamanlanmış Testler"
      subtitle={
        scheduledTests.length > 0 
          ? `Zamanlanmış testleri kontrol edin (${filteredTests.length} / ${scheduledTests.length} test)`
          : 'Zamanlanmış testleri kontrol edin'
      }
      headerActions={
        <button 
          className="btn-primary" 
          onClick={() => {
            setEditingSchedule(undefined);
            setIsModalOpen(true);
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}
        >
          <Plus size={16} />
          Yeni Zamanlama
        </button>
      }
    >
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '1.5rem' 
      }}>
        <select 
          value={filters.status[0] || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as any] : [] })}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid var(--border-primary)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="paused">Duraklatılmış</option>
          <option value="disabled">Devre Dışı</option>
        </select>
      </div>

      {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <CosmicSpinner size="lg" />
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ color: 'var(--status-error)', marginBottom: '1rem' }}>{error}</p>
              <button 
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Yeniden Dene
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr', 
              gap: '1.5rem' 
            }}>
              {/* Scheduled Tests */}
              <div className="card">
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  margin: '0 0 1rem 0'
                }}>
                  Zamanlanmış Testler
                </h3>
                
                {filteredTests.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Henüz zamanlanmış test yok</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setIsModalOpen(true)}
                      style={{ marginTop: '1rem' }}
                    >
                      İlk Zamanlamayı Oluştur
                    </button>
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
                                Zamanlama
                              </span>
                            </div>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: 'var(--text-primary)',
                              margin: 0,
                              fontWeight: 500
                            }}>
                              {getScheduleDescription(test.schedule)}
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
                                Sonraki Çalışma
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
                          <button 
                            onClick={() => toggleSchedule(test.id)}
                            style={{ 
                              padding: '0.5rem', 
                              color: 'var(--status-warning)', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Pause size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleSchedule(test.id)}
                            style={{ 
                              padding: '0.5rem', 
                              color: 'var(--status-success)', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Play size={18} />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            setEditingSchedule(test);
                            setIsModalOpen(true);
                          }}
                          style={{ 
                            padding: '0.5rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.375rem',
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
                        >
                          <Edit size={18} />
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (confirm('Bu zamanlamayı silmek istediğinizden emin misiniz?')) {
                              deleteSchedule(test.id);
                            }
                          }}
                          style={{ 
                            padding: '0.5rem', 
                            color: 'var(--status-error)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
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
                          <span>Son Çalışma: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {formatRelativeTime(test.lastRun)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          <span>Süre: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {formatDuration(test.lastDuration || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Başarı Oranı:
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
              <div className="card">
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  margin: '0 0 1rem 0'
                }}>
                  Yaklaşan Testler
                </h3>
                
                {(() => {
                  // Aktif zamanlamaları nextRun'a göre sırala ve ilk 5'ini al
                  const upcoming = scheduledTests
                    .filter(s => s.enabled && s.status === 'active' && s.nextRun)
                    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
                    .slice(0, 5);
                  
                  if (upcoming.length === 0) {
                    return (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.875rem' }}>Yaklaşan test yok</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {upcoming.map((schedule) => (
                        <div 
                          key={schedule.id}
                          style={{ 
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setIsModalOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                          }}
                        >
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem'
                          }}>
                            <h4 style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              color: 'var(--text-primary)',
                              margin: 0,
                              flex: 1
                            }}>
                              {schedule.name}
                            </h4>
                            <span style={{
                              fontSize: '0.625rem',
                              padding: '0.125rem 0.375rem',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-tertiary)',
                              borderRadius: '0.25rem',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              letterSpacing: '0.05em'
                            }}>
                              {schedule.suite}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Clock size={12} color="var(--text-tertiary)" />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '-'}
                              </span>
                            </div>
                            
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--text-tertiary)',
                              marginTop: '0.125rem'
                            }}>
                              {getScheduleDescription(schedule.schedule)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
    </PageLayout>
  );
} 