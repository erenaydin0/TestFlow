'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  Download, 
  Filter,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  AlertCircle
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

// Mock data
const REPORTS = [
  {
    id: '1',
    name: 'Günlük Test Raporu - 15 Ocak 2024',
    type: 'daily',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    testsRun: 45,
    passed: 42,
    failed: 3,
    duration: 12340,
    environment: 'production',
    fileSize: '2.4 MB'
  },
  {
    id: '2',
    name: 'Haftalık Performans Raporu - 2. Hafta',
    type: 'weekly',
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    testsRun: 156,
    passed: 142,
    failed: 14,
    duration: 45600,
    environment: 'staging',
    fileSize: '5.8 MB'
  },
  {
    id: '3',
    name: 'API Test Detay Raporu',
    type: 'detailed',
    generatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    testsRun: 28,
    passed: 26,
    failed: 2,
    duration: 8920,
    environment: 'production',
    fileSize: '1.2 MB'
  },
  {
    id: '4',
    name: 'Aylık Özet Raporu - Aralık 2023',
    type: 'monthly',
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    testsRun: 892,
    passed: 824,
    failed: 68,
    duration: 234560,
    environment: 'production',
    fileSize: '12.7 MB'
  }
];

const DAILY_STATS = [
  { date: '10 Oca', tests: 42, passed: 39, failed: 3 },
  { date: '11 Oca', tests: 45, passed: 43, failed: 2 },
  { date: '12 Oca', tests: 38, passed: 35, failed: 3 },
  { date: '13 Oca', tests: 51, passed: 48, failed: 3 },
  { date: '14 Oca', tests: 47, passed: 44, failed: 3 },
  { date: '15 Oca', tests: 45, passed: 42, failed: 3 },
  { date: '16 Oca', tests: 49, passed: 47, failed: 2 }
];

const TEST_SUITE_PERFORMANCE = [
  { suite: 'Authentication', avgDuration: 2340, successRate: 98.5, totalRuns: 156 },
  { suite: 'E-commerce', avgDuration: 5670, successRate: 94.2, totalRuns: 124 },
  { suite: 'API Tests', avgDuration: 1200, successRate: 99.1, totalRuns: 89 },
  { suite: 'UI/UX', avgDuration: 3450, successRate: 91.7, totalRuns: 67 }
];

function getReportTypeLabel(type: string): string {
  const typeMap: { [key: string]: string } = {
    'daily': 'Günlük',
    'weekly': 'Haftalık',
    'monthly': 'Aylık',
    'detailed': 'Detaylı'
  };
  return typeMap[type] || type;
}

function getReportTypeColor(type: string): string {
  const colorMap: { [key: string]: string } = {
    'daily': '#2563eb',
    'weekly': '#059669',
    'monthly': '#dc2626',
    'detailed': '#d97706'
  };
  return colorMap[type] || '#6b7280';
}

export default function ReportsPage() {
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
          {/* Stats Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Bugün Çalışan
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    45
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <TrendingUp size={12} color="#059669" />
                    <span style={{ fontSize: '0.75rem', color: '#059669' }}>+8%</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '0.5rem' 
                }}>
                  <BarChart3 size={20} color="#2563eb" />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Başarı Oranı
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                    93.3%
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <TrendingUp size={12} color="#059669" />
                    <span style={{ fontSize: '0.75rem', color: '#059669' }}>+2.1%</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '0.5rem' 
                }}>
                  <TrendingUp size={20} color="#059669" />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Ortalama Süre
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    4.2s
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <TrendingDown size={12} color="#dc2626" />
                    <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>+0.3s</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0.5rem' 
                }}>
                  <Clock size={20} color="#d97706" />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Toplam Rapor
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {REPORTS.length}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Bu ay</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '0.5rem' 
                }}>
                  <FileText size={20} color="#6b7280" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
              }}>
                <Filter size={16} />
                <span>Filtrele</span>
              </button>
              
              <select style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}>
                <option value="">Tüm Rapor Türleri</option>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="detailed">Detaylı</option>
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
              <Download size={16} />
              Yeni Rapor Oluştur
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '1.5rem' 
          }}>
            {/* Reports List */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Son Raporlar
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {REPORTS.map((report) => (
                  <div 
                    key={report.id}
                    style={{ 
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-primary)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow)';
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
                            {report.name}
                          </h4>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: getReportTypeColor(report.type) + '20',
                            color: getReportTypeColor(report.type),
                            fontSize: '0.75rem',
                            borderRadius: '0.375rem',
                            fontWeight: 500
                          }}>
                            {getReportTypeLabel(report.type)}
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '1rem',
                          marginBottom: '0.75rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                              Toplam Test
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {report.testsRun}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                              Başarı Oranı
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              color: (report.passed / report.testsRun) >= 0.95 ? '#059669' : '#d97706'
                            }}>
                              {((report.passed / report.testsRun) * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                              Toplam Süre
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatDuration(report.duration)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button style={{ 
                        padding: '0.5rem', 
                        color: '#2563eb', 
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                        <Download size={18} />
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-primary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} color="var(--text-tertiary)" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {formatRelativeTime(report.generatedAt)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            width: '0.75rem', 
                            height: '0.75rem', 
                            backgroundColor: report.environment === 'production' ? '#059669' : '#d97706',
                            borderRadius: '50%',
                            display: 'inline-block'
                          }}></span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {report.environment}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {report.fileSize}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Suite Performance */}
            <div className="card">
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: '0 0 1rem 0'
              }}>
                Test Grubu Performansı
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {TEST_SUITE_PERFORMANCE.map((suite, index) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {suite.suite}
                      </h4>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        color: suite.successRate >= 95 ? '#059669' : suite.successRate >= 85 ? '#d97706' : '#dc2626'
                      }}>
                        {suite.successRate}%
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Ortalama Süre
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatDuration(suite.avgDuration)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Toplam Çalışma
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {suite.totalRuns}
                        </span>
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
                  Detaylı Analiz Görüntüle
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 