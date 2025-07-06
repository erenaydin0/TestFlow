'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle,
  Play,
  Eye,
  Image,
  Video,
  RefreshCw
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { ExecutionResult } from '@/types';

export default function ReportsPage() {
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionResult | null>(null);

  // Fetch executions from backend
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/executions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExecutions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching executions:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  // Calculate stats
  const stats = {
    totalExecutions: executions.length,
    completedExecutions: executions.filter(e => e.status === 'completed').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
    avgDuration: executions.length > 0 ? 
      Math.round(executions.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / executions.filter(e => e.duration).length) : 0,
    successRate: executions.length > 0 ? 
      Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100) : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'failed': return '#dc2626';
      case 'running': return '#d97706';
      case 'queued': return '#6b7280';
      case 'cancelled': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      case 'running': return 'Çalışıyor';
      case 'queued': return 'Sırada';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: '16rem',
        paddingTop: '4rem'
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
                Test Raporları
              </h1>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0.5rem 0 0 0' 
              }}>
                Çalıştırılan testlerin detaylı sonuçları
              </p>
            </div>
            
            <button
              onClick={fetchExecutions}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Yenile
            </button>
          </div>

          {/* Stats Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Toplam Test
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {stats.totalExecutions}
                  </p>
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
                    Başarılı
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                    {stats.completedExecutions}
                  </p>
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
                    Başarısız
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                    {stats.failedExecutions}
                  </p>
                </div>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '0.5rem' 
                }}>
                  <TrendingDown size={20} color="#dc2626" />
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
                    {formatDuration(stats.avgDuration)}
                  </p>
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
                    Başarı Oranı
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                    {stats.successRate}%
                  </p>
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
          </div>

          {/* Executions List */}
          <div className="card">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                margin: 0 
              }}>
                Test Execution Geçmişi
              </h2>
            </div>

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
                color: '#dc2626'
              }}>
                <AlertCircle size={24} />
                <span style={{ marginLeft: '0.5rem' }}>Hata: {error}</span>
              </div>
            ) : executions.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '2rem',
                color: 'var(--text-secondary)'
              }}>
                <FileText size={24} />
                <span style={{ marginLeft: '0.5rem' }}>Henüz test çalıştırılmamış</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Test Adı
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Durum
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Başlangıç
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Süre
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Adım Sayısı
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Başarı Oranı
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Özellikler
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((execution) => (
                      <tr key={execution.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div>
                            <div style={{ 
                              fontWeight: 500, 
                              color: 'var(--text-primary)',
                              marginBottom: '0.25rem'
                            }}>
                              {execution.workflowName}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-secondary)' 
                            }}>
                              ID: {execution.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: `${getStatusColor(execution.status)}20`,
                            color: getStatusColor(execution.status)
                          }}>
                            {getStatusLabel(execution.status)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {formatRelativeTime(new Date(execution.startTime))}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {execution.duration ? formatDuration(execution.duration) : '-'}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {execution.steps.length}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {execution.successRate !== undefined ? `${execution.successRate}%` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {execution.options.enableScreenshots && (
                              <span style={{ 
                                padding: '0.125rem 0.25rem',
                                backgroundColor: '#8b5cf620',
                                color: '#8b5cf6',
                                borderRadius: '0.25rem',
                                fontSize: '0.625rem'
                              }}>
                                📸
                              </span>
                            )}
                            {execution.options.enableRecording && (
                              <span style={{ 
                                padding: '0.125rem 0.25rem',
                                backgroundColor: '#ef444420',
                                color: '#ef4444',
                                borderRadius: '0.25rem',
                                fontSize: '0.625rem'
                              }}>
                                🎥
                              </span>
                            )}
                            {execution.options.headlessMode && (
                              <span style={{ 
                                padding: '0.125rem 0.25rem',
                                backgroundColor: '#22c55e20',
                                color: '#22c55e',
                                borderRadius: '0.25rem',
                                fontSize: '0.625rem'
                              }}>
                                👁️
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => setSelectedExecution(execution)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                {selectedExecution.workflowName} - Detaylar
              </h3>
              <button
                onClick={() => setSelectedExecution(null)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Execution info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p><strong>ID:</strong> {selectedExecution.id}</p>
              <p><strong>Durum:</strong> {getStatusLabel(selectedExecution.status)}</p>
              <p><strong>Başlangıç:</strong> {new Date(selectedExecution.startTime).toLocaleString('tr-TR')}</p>
              {selectedExecution.endTime && (
                <p><strong>Bitiş:</strong> {new Date(selectedExecution.endTime).toLocaleString('tr-TR')}</p>
              )}
              {selectedExecution.duration && (
                <p><strong>Süre:</strong> {formatDuration(selectedExecution.duration)}</p>
              )}
              {selectedExecution.successRate !== undefined && (
                <p><strong>Başarı Oranı:</strong> {selectedExecution.successRate}%</p>
              )}
            </div>

            {/* Steps */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Test Adımları</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {selectedExecution.steps.map((step, index) => (
                  <div key={step.stepId} style={{
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    borderLeft: `4px solid ${getStatusColor(step.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>
                        {index + 1}. {step.type}
                      </span>
                      <span style={{
                        padding: '0.125rem 0.25rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: `${getStatusColor(step.status)}20`,
                        color: getStatusColor(step.status)
                      }}>
                        {getStatusLabel(step.status)}
                      </span>
                    </div>
                    {step.error && (
                      <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                        {step.error}
                      </p>
                    )}
                    {step.duration && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                        Süre: {formatDuration(step.duration)}
                      </p>
                    )}
                    {step.screenshot && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a 
                          href={`http://localhost:3001${step.screenshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Image size={12} />
                          Ekran Görüntüsü
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshots and Video */}
            {(selectedExecution.screenshots.length > 0 || selectedExecution.videoPath) && (
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Medya Dosyaları</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedExecution.screenshots.map((screenshot, index) => (
                    <a 
                      key={index}
                      href={`http://localhost:3001${screenshot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#8b5cf620',
                        color: '#8b5cf6',
                        borderRadius: '0.25rem',
                        textDecoration: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Image size={12} />
                      Screenshot {index + 1}
                    </a>
                  ))}
                  {selectedExecution.videoPath && (
                    <a 
                      href={`http://localhost:3001${selectedExecution.videoPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef444420',
                        color: '#ef4444',
                        borderRadius: '0.25rem',
                        textDecoration: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Video size={12} />
                      Video Kaydı
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 