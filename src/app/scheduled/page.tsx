'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  Calendar,
  Settings,
  MoreVertical
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

// Mock data
const SCHEDULED_TESTS = [
  {
    id: '1',
    name: 'Daily Login Test',
    description: 'Her gün çalışan login testi',
    schedule: '0 9 * * *', // Every day at 9 AM
    status: 'active',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    duration: 2340,
    successRate: 98.5,
    suite: 'Authentication',
    environment: 'production'
  },
  {
    id: '2',
    name: 'Weekly E-commerce Test',
    description: 'Haftalık e-ticaret fonksiyonları testi',
    schedule: '0 2 * * 1', // Every Monday at 2 AM
    status: 'active',
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    duration: 8920,
    successRate: 94.2,
    suite: 'E-commerce',
    environment: 'staging'
  },
  {
    id: '3',
    name: 'Hourly Health Check',
    description: 'Saatlik sistem sağlık kontrolü',
    schedule: '0 * * * *', // Every hour
    status: 'paused',
    lastRun: new Date(Date.now() - 30 * 60 * 1000),
    nextRun: new Date(Date.now() + 30 * 60 * 1000),
    duration: 450,
    successRate: 99.8,
    suite: 'System',
    environment: 'production'
  },
  {
    id: '4',
    name: 'Monthly Report Generation',
    description: 'Aylık rapor oluşturma testi',
    schedule: '0 0 1 * *', // First day of every month at midnight
    status: 'disabled',
    lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    duration: 12000,
    successRate: 87.3,
    suite: 'Reports',
    environment: 'production'
  }
];

const UPCOMING_RUNS = [
  {
    id: '1',
    testName: 'Daily Login Test',
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000),
    estimatedDuration: 2340,
    environment: 'production'
  },
  {
    id: '2',
    testName: 'API Health Check',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    estimatedDuration: 1200,
    environment: 'staging'
  },
  {
    id: '3',
    testName: 'Database Backup Test',
    scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    estimatedDuration: 5400,
    environment: 'production'
  }
];

function getScheduleDescription(schedule: string): string {
  const scheduleMap: { [key: string]: string } = {
    '0 9 * * *': 'Her gün 09:00',
    '0 2 * * 1': 'Her Pazartesi 02:00',
    '0 * * * *': 'Her saat başı',
    '0 0 1 * *': 'Her ayın 1\'inde 00:00'
  };
  return scheduleMap[schedule] || schedule;
}

export default function ScheduledPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: '16rem',
        paddingTop: '4rem' // Header height
      }}>
        <Header />
        <main style={{ padding: '1.5rem' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}>
            <div>
              <h1 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)', 
                margin: 0 
              }}>
                Zamanlanmış Testler
              </h1>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0.5rem 0 0 0' 
              }}>
                Zamanlanmış testleri kontrol edin
                {SCHEDULED_TESTS.length > 0 && (
                  <span style={{ color: '#2563eb', marginLeft: '0.5rem' }}>
                    ({SCHEDULED_TESTS.length} / {SCHEDULED_TESTS.length} test)
                  </span>
                )}
              </p>
            </div>
          </div>
        
        
          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}>
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="paused">Duraklatılmış</option>
                <option value="disabled">Devre Dışı</option>
              </select>
              
              <select style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}>
                <option value="">Tüm Ortamlar</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
            
            <button className="btn-primary" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <Plus size={16} />
              Yeni Zamanlama
            </button>
          </div>

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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {SCHEDULED_TESTS.map((test) => (
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
                              {formatRelativeTime(test.nextRun)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {test.status === 'active' ? (
                          <button style={{ 
                            padding: '0.5rem', 
                            color: '#d97706', 
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
                          }}>
                            <Pause size={18} />
                          </button>
                        ) : (
                          <button style={{ 
                            padding: '0.5rem', 
                            color: '#059669', 
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
                          }}>
                            <Play size={18} />
                          </button>
                        )}
                        
                        <button style={{ 
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
                        }}>
                          <Settings size={18} />
                        </button>
                        
                        <button style={{ 
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
                        }}>
                          <MoreVertical size={18} />
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
                            {formatDuration(test.duration)}
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
                          color: test.successRate >= 95 ? '#059669' : test.successRate >= 85 ? '#d97706' : '#dc2626'
                        }}>
                          {test.successRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Runs */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Yaklaşan Çalışmalar
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {UPCOMING_RUNS.map((run) => (
                  <div 
                    key={run.id}
                    style={{ 
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: 'var(--text-primary)',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {run.testName}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={12} color="var(--text-tertiary)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatRelativeTime(run.scheduledTime)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          width: '0.75rem', 
                          height: '0.75rem', 
                          backgroundColor: run.environment === 'production' ? '#059669' : '#d97706',
                          borderRadius: '50%',
                          display: 'inline-block'
                        }}></span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {run.environment}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Tahmini süre: {formatDuration(run.estimatedDuration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-primary)'
              }}>
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Tüm Zamanlamaları Görüntüle
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 