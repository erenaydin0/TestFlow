'use client';

import { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { ExecutionResult } from '@/types';

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  status: string;
  dateRange: string;
  workflowName: string;
  hasScreenshots: boolean | null;
  hasRecording: boolean | null;
  headlessMode: boolean | null;
}

export default function ReportsPage() {
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionResult | null>(null);
  
  // Filtering and sorting state
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    dateRange: '',
    workflowName: '',
    hasScreenshots: null,
    hasRecording: null,
    headlessMode: null
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter and sort executions
  const filteredAndSortedExecutions = useMemo(() => {
    let filtered = executions.filter(execution => {
      // Status filter
      if (filters.status && execution.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const executionDate = new Date(execution.startTime);
        const now = new Date();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        switch (filters.dateRange) {
          case 'today':
            if (executionDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'yesterday':
            const yesterday = new Date(now.getTime() - dayInMs);
            if (executionDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last7days':
            if (executionDate.getTime() < now.getTime() - 7 * dayInMs) return false;
            break;
          case 'last30days':
            if (executionDate.getTime() < now.getTime() - 30 * dayInMs) return false;
            break;
        }
      }

      // Workflow name filter
      if (filters.workflowName && !execution.workflowName.toLowerCase().includes(filters.workflowName.toLowerCase())) {
        return false;
      }

      // Screenshots filter
      if (filters.hasScreenshots !== null && execution.options.enableScreenshots !== filters.hasScreenshots) {
        return false;
      }

      // Recording filter
      if (filters.hasRecording !== null && execution.options.enableRecording !== filters.hasRecording) {
        return false;
      }

      // Headless mode filter
      if (filters.headlessMode !== null && execution.options.headlessMode !== filters.headlessMode) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'startTime':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'workflowName':
          aValue = a.workflowName.toLowerCase();
          bValue = b.workflowName.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'successRate':
          aValue = a.successRate || 0;
          bValue = b.successRate || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [executions, filters, sortField, sortOrder]);

  // Calculate stats based on filtered results
  const stats = useMemo(() => {
    const filtered = filteredAndSortedExecutions;
    return {
      totalExecutions: filtered.length,
      completedExecutions: filtered.filter(e => e.status === 'completed').length,
      failedExecutions: filtered.filter(e => e.status === 'failed').length,
      avgDuration: filtered.length > 0 ? 
        Math.round(filtered.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0) / filtered.filter(e => e.duration).length) : 0,
      successRate: filtered.length > 0 ? 
        Math.round((filtered.filter(e => e.status === 'completed').length / filtered.length) * 100) : 0
    };
  }, [filteredAndSortedExecutions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateRange: '',
      workflowName: '',
      hasScreenshots: null,
      hasRecording: null,
      headlessMode: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'failed': return '#dc2626';
      case 'running': return '#d97706';
      case 'queued': return '#6b7280';
      case 'cancelled': return '#9ca3af';
      case 'passed': return '#059669';
      case 'pending': return '#6b7280';
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
      case 'passed': return 'Başarılı';
      case 'pending': return 'Bekliyor';
      default: return status;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} />;
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
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
                {hasActiveFilters && (
                  <span style={{ color: '#2563eb', marginLeft: '0.5rem' }}>
                    ({filteredAndSortedExecutions.length} / {executions.length} sonuç)
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: showFilters ? '#2563eb' : 'var(--bg-primary)',
                  color: showFilters ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Filter size={16} />
                Filtrele
                {hasActiveFilters && (
                  <span style={{
                    backgroundColor: showFilters ? 'rgba(255,255,255,0.2)' : '#ef4444',
                    color: showFilters ? 'white' : 'white',
                    borderRadius: '50%',
                    width: '1rem',
                    height: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    fontWeight: 'bold'
                  }}>
                    {Object.values(filters).filter(v => v !== '' && v !== null).length}
                  </span>
                )}
              </button>
              
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
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Filtreler</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <X size={12} />
                    Temizle
                  </button>
                )}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {/* Workflow Name Search */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Test Adı
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-secondary)' 
                    }} />
                    <input
                      type="text"
                      placeholder="Test adı ara..."
                      value={filters.workflowName}
                      onChange={(e) => handleFilterChange('workflowName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Durum
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="failed">Başarısız</option>
                    <option value="running">Çalışıyor</option>
                    <option value="queued">Sırada</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Tarih Aralığı
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tüm Zamanlar</option>
                    <option value="today">Bugün</option>
                    <option value="yesterday">Dün</option>
                    <option value="last7days">Son 7 Gün</option>
                    <option value="last30days">Son 30 Gün</option>
                  </select>
                </div>

                {/* Screenshots Filter */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Ekran Görüntüsü
                  </label>
                  <select
                    value={filters.hasScreenshots === null ? '' : filters.hasScreenshots.toString()}
                    onChange={(e) => handleFilterChange('hasScreenshots', e.target.value === '' ? null : e.target.value === 'true')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tümü</option>
                    <option value="true">Etkin</option>
                    <option value="false">Devre Dışı</option>
                  </select>
                </div>

                {/* Recording Filter */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Video Kaydı
                  </label>
                  <select
                    value={filters.hasRecording === null ? '' : filters.hasRecording.toString()}
                    onChange={(e) => handleFilterChange('hasRecording', e.target.value === '' ? null : e.target.value === 'true')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tümü</option>
                    <option value="true">Etkin</option>
                    <option value="false">Devre Dışı</option>
                  </select>
                </div>

                {/* Headless Mode Filter */}
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                    Headless Mod
                  </label>
                  <select
                    value={filters.headlessMode === null ? '' : filters.headlessMode.toString()}
                    onChange={(e) => handleFilterChange('headlessMode', e.target.value === '' ? null : e.target.value === 'true')}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tümü</option>
                    <option value="true">Etkin</option>
                    <option value="false">Devre Dışı</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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
                Test Geçmişi
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
            ) : filteredAndSortedExecutions.length === 0 ? (
          <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '2rem',
                color: 'var(--text-secondary)'
              }}>
                <FileText size={24} />
                <span style={{ marginLeft: '0.5rem' }}>
                  {hasActiveFilters ? 'Filtre kriterlerine uygun sonuç bulunamadı' : 'Henüz test çalıştırılmamış'}
                </span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th 
                    style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('workflowName')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Test Adı
                          {getSortIcon('workflowName')}
                        </div>
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('status')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Durum
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('startTime')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Başlangıç
                          {getSortIcon('startTime')}
                        </div>
                      </th>
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('duration')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Süre
                          {getSortIcon('duration')}
                            </div>
                      </th>

                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('successRate')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Başarı Oranı
                          {getSortIcon('successRate')}
                            </div>
                      </th>

                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedExecutions.map((execution) => (
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
                          {(() => {
                            const totalSteps = execution.steps.length;
                            const completedSteps = execution.steps.filter(step => step.status === 'passed').length;
                            const successRate = execution.successRate !== undefined ? execution.successRate : 0;
                            return `${completedSteps}/${totalSteps} %${successRate}`;
                          })()}
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