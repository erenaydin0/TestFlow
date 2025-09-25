'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSidebar } from '@/lib/sidebar-context';
import StatusBadge from '@/components/StatusBadge';
import StatsCards from '@/components/StatsCards';
import MultiSelect from '@/components/MultiSelect';
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
  X,
  Tag,
  Trash2
} from 'lucide-react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { ExecutionResult } from '@/types';
import { getStatusColor, getStatusText } from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTestNotifications } from '@/hooks/useTestNotifications';

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate' | 'suite' | 'tags';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  status: string;
  dateRange: string;
  workflowName: string;
  suite: string[];
  tags: string[];
}

export default function ReportsPage() {
  const { isCollapsed } = useSidebar();
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionResult | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const searchParams = useSearchParams();
  
  const { notifyTestDeleted, notifyTestFailure } = useTestNotifications();
  
  // Filtering and sorting state
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    dateRange: '',
    workflowName: '',
    suite: [],
    tags: []
  });
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

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

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setFilters(prev => ({
        ...prev,
        workflowName: searchQuery
      }));
    }
  }, [searchParams]);

  // Handle execution ID parameter to open details modal
  useEffect(() => {
    const executionId = searchParams.get('executionId');
    if (executionId && executions.length > 0) {
      const execution = executions.find(e => e.id === executionId);
      if (execution) {
        setSelectedExecution(execution);
      }
    }
  }, [searchParams, executions]);

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



      // Suite filter
      if (filters.suite.length > 0 && (!execution.suite || !filters.suite.includes(execution.suite))) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0 && (!execution.tags || !execution.tags.some(tag => filters.tags.includes(tag)))) {
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
        case 'suite':
          aValue = (a.suite || '').toLowerCase();
          bValue = (b.suite || '').toLowerCase();
          break;
        case 'tags':
          aValue = (a.tags || []).length;
          bValue = (b.tags || []).length;
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
      suite: [],
      tags: []
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null;
  });

  // Benzersiz suite ve tag değerlerini toplama
  const { uniqueSuites, uniqueTags, uniqueStatuses } = useMemo(() => {
    const suites = new Set<string>();
    const tags = new Set<string>();
    const statuses = new Set<string>();

    executions.forEach(execution => {
      if (execution.suite && execution.suite.trim()) {
        suites.add(execution.suite);
      }
      if (execution.tags && execution.tags.length > 0) {
        execution.tags.forEach(tag => {
          if (tag.trim()) {
            tags.add(tag);
          }
        });
      }
      if (execution.status) {
        statuses.add(execution.status);
      }
    });

    return {
      uniqueSuites: Array.from(suites).sort(),
      uniqueTags: Array.from(tags).sort(),
      uniqueStatuses: Array.from(statuses).sort()
    };
  }, [executions]);



  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} />;
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  // Create single CSV report for test execution
  const createTestCSVReport = (executions: ExecutionResult[]) => {
    const csvHeaders = [
      'Test Adı',
      'Execution ID',
      'Durum',
      'Başlangıç Zamanı',
      'Bitiş Zamanı',
      'Toplam Süre (ms)',
      'Başarı Oranı (%)',
      'Test Grubu',
      'Etiketler',
      'Toplam Adım',
      'Başarılı Adım',
      'Başarısız Adım',
      'Video Mevcut',
      'Ekran Görüntüsü Sayısı',
      'İlk Adım Türü',
      'Son Adım Türü',
      'İlk Hata',
      'Son Adım Süresi (ms)',
      'Ortalama Adım Süresi (ms)',
      'En Uzun Adım (ms)',
      'Raporlama Tarihi'
    ];
    
    const csvRows = executions.map(execution => {
      const stepDurations = execution.steps.filter(s => s.duration).map(s => s.duration!);
      const avgStepDuration = stepDurations.length > 0 ? Math.round(stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length) : 0;
      const maxStepDuration = stepDurations.length > 0 ? Math.max(...stepDurations) : 0;
      const firstError = execution.steps.find(s => s.error)?.error || '';
      const lastStepDuration = execution.steps[execution.steps.length - 1]?.duration || 0;
      
      return [
        execution.workflowName,
        execution.id,
        getStatusText(execution.status),
        execution.startTime ? new Date(execution.startTime).toLocaleString('tr-TR') : '',
        execution.endTime ? new Date(execution.endTime).toLocaleString('tr-TR') : '',
        execution.duration || '',
        execution.successRate || '',
        execution.suite || '',
        (execution.tags || []).join(', '),
        execution.steps.length,
        execution.steps.filter(s => s.status === 'passed').length,
        execution.steps.filter(s => s.status === 'failed').length,
        execution.videoPath ? 'Evet' : 'Hayır',
        execution.steps.filter(s => s.screenshot).length,
        execution.steps[0]?.type ? getStepTypeText(execution.steps[0].type) : '',
        execution.steps[execution.steps.length - 1]?.type ? getStepTypeText(execution.steps[execution.steps.length - 1].type) : '',
        firstError ? `"${firstError.replace(/"/g, '""')}"` : '',
        lastStepDuration,
        avgStepDuration,
        maxStepDuration,
        new Date().toLocaleString('tr-TR')
      ];
    });
    
    return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  };

  // Create detailed steps CSV report
  const createStepsCSVReport = (execution: ExecutionResult) => {
    const csvHeaders = [
      'Adım No',
      'Adım ID',
      'Adım Türü',
      'Durum',
      'Başlangıç Zamanı',
      'Bitiş Zamanı',
      'Süre (ms)',
      'URL',
      'Selector',
      'Girilen Değer',
      'Beklenen Değer',
      'Hata Mesajı',
      'Ekran Görüntüsü Var'
    ];
    
    const csvRows = execution.steps.map((step, index) => {
      return [
        index + 1,
        step.stepId || '',
        getStepTypeText(step.type),
        getStatusText(step.status),
        step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
        step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
        step.duration || '',
        step.config?.url || '',
        step.config?.selector || '',
        step.config?.value || step.config?.text || '',
        step.config?.expectedValue || '',
        step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
        step.screenshot ? 'Evet' : 'Hayır'
      ];
    });
    
    return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  };

  // Create consolidated steps CSV for multiple executions
  const createBulkStepsCSVReport = (executions: ExecutionResult[]) => {
    const csvHeaders = [
      'Test Adı',
      'Execution ID',
      'Adım No',
      'Adım ID',
      'Adım Türü',
      'Durum',
      'Başlangıç Zamanı',
      'Bitiş Zamanı',
      'Süre (ms)',
      'URL',
      'Selector',
      'Girilen Değer',
      'Beklenen Değer',
      'Hata Mesajı',
      'Ekran Görüntüsü Var'
    ];
    
    const csvRows: any[] = [];
    
    executions.forEach(execution => {
      execution.steps.forEach((step, index) => {
        csvRows.push([
          execution.workflowName,
          execution.id,
          index + 1,
          step.stepId || '',
          getStepTypeText(step.type),
          getStatusText(step.status),
          step.startTime ? new Date(step.startTime).toLocaleTimeString('tr-TR') : '',
          step.endTime ? new Date(step.endTime).toLocaleTimeString('tr-TR') : '',
          step.duration || '',
          step.config?.url || '',
          step.config?.selector || '',
          step.config?.value || step.config?.text || '',
          step.config?.expectedValue || '',
          step.error ? `"${step.error.replace(/"/g, '""')}"` : '',
          step.screenshot ? 'Evet' : 'Hayır'
        ]);
      });
    });
    
    return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  };

  const getStepTypeText = (type: string) => {
    switch (type) {
      case 'navigate': return 'Sayfa Geçişi';
      case 'click': return 'Tıklama';
      case 'input': return 'Metin Girişi';
      case 'wait': return 'Bekleme';
      case 'screenshot': return 'Ekran Görüntüsü';
      case 'verify': return 'Doğrulama';
      case 'scroll': return 'Kaydırma';
      case 'hover': return 'Üzerine Gelme';
      case 'key': return 'Tuş Basma';
      case 'refresh': return 'Sayfa Yenileme';
      case 'if': return 'Koşul Kontrolü';
      default: return type;
    }
  };

  // Single execution CSV + screenshots download
  const downloadSingleExecution = async (execution: ExecutionResult) => {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Create CSV reports
      const csvContent = createTestCSVReport([execution]);
      const stepsCSVContent = createStepsCSVReport(execution);
      
      zip.file('test_raporu.csv', '\uFEFF' + csvContent);
      zip.file('adim_detaylari.csv', '\uFEFF' + stepsCSVContent);
      
      // Add screenshots
      const screenshotsFolder = zip.folder('screenshots');
      for (let i = 0; i < execution.steps.length; i++) {
        const step = execution.steps[i];
        if (step.screenshot) {
          try {
            const response = await fetch(`http://localhost:3001${step.screenshot}`);
            if (response.ok) {
              const blob = await response.blob();
              const filename = `step_${i + 1}_${step.type}_${step.stepId?.slice(0, 8) || 'unknown'}.png`;
              screenshotsFolder?.file(filename, blob);
            }
          } catch (error) {
            console.error('Error downloading screenshot:', error);
          }
        }
      }
      
      // Add video if exists
      if (execution.videoPath) {
        try {
          const response = await fetch(`http://localhost:3001${execution.videoPath}`);
          if (response.ok) {
            const blob = await response.blob();
            zip.file('test_video.webm', blob);
          }
        } catch (error) {
          console.error('Error downloading video:', error);
        }
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${execution.workflowName}_${execution.id.slice(0, 8)}_rapor.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating report package:', error);
      notifyTestFailure('Single Download', '', 'Rapor paketi oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  // Selection functions
  const handleTestSelection = (testId: string, checked: boolean) => {
    const newSelection = new Set(selectedTests);
    if (checked) {
      newSelection.add(testId);
    } else {
      newSelection.delete(testId);
    }
    setSelectedTests(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests(new Set(filteredAndSortedExecutions.map(e => e.id)));
    } else {
      setSelectedTests(new Set());
    }
  };

  const downloadSelectedTests = async () => {
    if (selectedTests.size === 0) return;
    
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const selectedExecutions = filteredAndSortedExecutions.filter(e => selectedTests.has(e.id));
      
      // Create main CSV report
      const csvContent = createTestCSVReport(selectedExecutions);
      zip.file('toplu_test_raporu.csv', '\uFEFF' + csvContent);
      
      // Create consolidated steps CSV
      const allStepsCSV = createBulkStepsCSVReport(selectedExecutions);
      zip.file('tum_adim_detaylari.csv', '\uFEFF' + allStepsCSV);
      
      // Add screenshots and videos for each execution
      for (let execIndex = 0; execIndex < selectedExecutions.length; execIndex++) {
        const execution = selectedExecutions[execIndex];
        const executionFolder = zip.folder(`${execIndex + 1}_${execution.workflowName.replace(/[^a-zA-Z0-9]/g, '_')}_${execution.id.slice(0, 8)}`);
        
        // Add individual execution reports
        const stepsCSV = createStepsCSVReport(execution);
        executionFolder?.file('adim_detaylari.csv', '\uFEFF' + stepsCSV);
        
        // Add screenshots for this execution
        const screenshotsFolder = executionFolder?.folder('screenshots');
        for (let i = 0; i < execution.steps.length; i++) {
          const step = execution.steps[i];
          if (step.screenshot) {
            try {
              const response = await fetch(`http://localhost:3001${step.screenshot}`);
              if (response.ok) {
                const blob = await response.blob();
                const filename = `step_${i + 1}_${step.type}_${step.stepId?.slice(0, 8) || 'unknown'}.png`;
                screenshotsFolder?.file(filename, blob);
              }
            } catch (error) {
              console.error('Error downloading screenshot:', error);
            }
          }
        }
        
        // Add video for this execution
        if (execution.videoPath) {
          try {
            const response = await fetch(`http://localhost:3001${execution.videoPath}`);
            if (response.ok) {
              const blob = await response.blob();
              executionFolder?.file('test_video.webm', blob);
            }
          } catch (error) {
            console.error('Error downloading video:', error);
          }
        }
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TestFlow_TopluRapor_${new Date().toISOString().split('T')[0]}_${selectedTests.size}test.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Clear selection
      setSelectedTests(new Set());
      
    } catch (error) {
      console.error('Error creating bulk report package:', error);
      notifyTestFailure('Bulk Download', '', 'Toplu rapor paketi oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const deleteSelectedTests = async () => {
    if (selectedTests.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedTests).map(async (testId) => {
        const response = await fetch(`http://localhost:3001/api/executions/${testId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error(`Test ${testId} silinirken hata oluştu`);
        }
        return testId;
      });

      await Promise.all(deletePromises);
      
      // Refresh executions list
      await fetchExecutions();
      
      const deletedCount = selectedTests.size;
      
      // Clear selection
      setSelectedTests(new Set());
      
      notifyTestDeleted(`${deletedCount} test kaydı`, '');
    } catch (error) {
      console.error('Error deleting tests:', error);
      notifyTestFailure('Bulk Delete', '', 'Testler silinirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4rem' : '16rem',
        transition: 'margin-left 0.3s ease',
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
                Test Sonuçları
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



          {/* Stats Overview */}
          <StatsCards stats={stats} loading={loading} />

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
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                {/* Test Name Search */}
                <div style={{ position: 'relative', minWidth: '150px' }}>
                  <Search size={14} style={{ 
                    position: 'absolute', 
                    left: '0.5rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-secondary)' 
                  }} />
                  <input
                    type="text"
                    placeholder="Test adı..."
                    value={filters.workflowName}
                    onChange={(e) => handleFilterChange('workflowName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.5rem 0.375rem 2rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    minWidth: '120px'
                  }}
                >
                  <option value="">Tüm Durumlar</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>

                {/* Date Range Filter */}
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    minWidth: '100px'
                  }}
                >
                  <option value="">Tüm Zamanlar</option>
                  <option value="today">Bugün</option>
                  <option value="yesterday">Dün</option>
                  <option value="last7days">Son 7 Gün</option>
                  <option value="last30days">Son 30 Gün</option>
                </select>

                {/* Suite Filter */}
                <MultiSelect
                  options={uniqueSuites}
                  selectedValues={filters.suite}
                  onChange={(values) => handleFilterChange('suite', values)}
                  placeholder="Tüm Test Grupları"
                  className="min-w-[120px]"
                />

                {/* Tags Filter */}
                <MultiSelect
                  options={uniqueTags}
                  selectedValues={filters.tags}
                  onChange={(values) => handleFilterChange('tags', values)}
                  placeholder="Tüm Etiketler"
                  className="min-w-[120px]"
                />

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <X size={12} />
                    Temizle
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedTests.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {selectedTests.size} test seçili
                    </span>
                    <button
                      onClick={downloadSelectedTests}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Download size={12} />
                      Seçilenleri İndir
                    </button>
                    <button
                      onClick={deleteSelectedTests}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Trash2 size={12} />
                      Sil
                    </button>
                    <button
                      onClick={() => setSelectedTests(new Set())}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <X size={12} />
                      Seçimi Temizle
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Keep old filters section hidden */}
            {false && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-primary)',
                flexWrap: 'wrap'
              }}>
                {/* Test Name Search */}
                <div style={{ position: 'relative', minWidth: '150px' }}>
                  <Search size={14} style={{ 
                    position: 'absolute', 
                    left: '0.5rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-secondary)' 
                  }} />
                  <input
                    type="text"
                    placeholder="Test adı..."
                    value={filters.workflowName}
                    onChange={(e) => handleFilterChange('workflowName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.5rem 0.375rem 2rem',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.375rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    minWidth: '100px'
                  }}
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="failed">Başarısız</option>
                  <option value="running">Çalışıyor</option>
                  <option value="queued">Sırada</option>
                </select>

                {/* Date Range Filter */}
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    minWidth: '100px'
                  }}
                >
                  <option value="">Tüm Zamanlar</option>
                  <option value="today">Bugün</option>
                  <option value="yesterday">Dün</option>
                  <option value="last7days">Son 7 Gün</option>
                  <option value="last30days">Son 30 Gün</option>
                </select>

                {/* Suite Filter */}
                <MultiSelect
                  options={uniqueSuites}
                  selectedValues={filters.suite}
                  onChange={(values) => handleFilterChange('suite', values)}
                  placeholder="Tüm Test Grupları"
                  className="min-w-[120px]"
                />

                {/* Tags Filter */}
                <MultiSelect
                  options={uniqueTags}
                  selectedValues={filters.tags}
                  onChange={(values) => handleFilterChange('tags', values)}
                  placeholder="Tüm Etiketler"
                  className="min-w-[120px]"
                />

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <X size={12} />
                    Temizle
                  </button>
                )}
              </div>
            )}

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
                      <th style={{ padding: '0.75rem', textAlign: 'left', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedTests.size === filteredAndSortedExecutions.length && filteredAndSortedExecutions.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
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
                      <th 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('suite')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Test Grubu
                          {getSortIcon('suite')}
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
                        onClick={() => handleSort('tags')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Etiketler
                          {getSortIcon('tags')}
                        </div>
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Rapor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedExecutions.map((execution) => (
                      <tr 
                        key={execution.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border-primary)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                          // Checkbox ve butonlara tıklanınca modal açılmasın
                          if (e.target instanceof HTMLInputElement || 
                              e.target instanceof HTMLButtonElement ||
                              (e.target as HTMLElement).closest('button')) {
                            return;
                          }
                          setSelectedExecution(execution);
                        }}
                      >
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedTests.has(execution.id)}
                            onChange={(e) => handleTestSelection(execution.id, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
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
                          <StatusBadge status={execution.status} size="md" />
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
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {execution.suite || '-'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {execution.tags && execution.tags.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {execution.tags.slice(0, 2).map((tag, index) => (
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
                                  <Tag size={12} />
                                  {tag}
                              </span>
                              ))}
                              {execution.tags.length > 2 && (
                              <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: 'var(--text-tertiary)' 
                                }}>
                                  +{execution.tags.length - 2}
                              </span>
                            )}
                          </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSingleExecution(execution);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 500
                            }}
                          >
                            <Download size={14} />
                            İndir
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
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '90vh',
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
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>Durum:</strong> 
                <StatusBadge status={selectedExecution.status} size="md" />
              </p>
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
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {selectedExecution.steps.map((step, index) => (
                  <div key={step.stepId} style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    borderLeft: `4px solid ${getStatusColor(step.status)}`,
                    border: step.status === 'failed' ? '1px solid #dc2626' : '1px solid var(--border-primary)'
                  }}>
                    {/* Step Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          backgroundColor: getStatusColor(step.status) + '20',
                          color: getStatusColor(step.status),
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          minWidth: '2rem',
                          textAlign: 'center'
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '1rem', textTransform: 'capitalize' }}>
                          {step.type}
                        </span>
                      </div>
                      <StatusBadge status={step.status} size="md" />
                    </div>

                    {/* Step Config Details */}
                    {step.config && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', alignItems: 'start' }}>
                          {step.config.url && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>URL:</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {step.config.url}
                              </span>
                            </>
                          )}
                          {step.config.selector && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Selector:</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                {step.config.selector}
                              </span>
                            </>
                          )}
                          {step.config.value && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Değer:</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                {step.config.value}
                              </span>
                            </>
                          )}
                          {step.config.text && step.config.text !== step.config.value && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Metin:</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                {step.config.text}
                              </span>
                            </>
                          )}
                          {step.config.expectedValue && (
                            <>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Beklenen:</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                {step.config.expectedValue}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step Timing */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      {step.startTime && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          Başlangıç: {new Date(step.startTime).toLocaleTimeString('tr-TR')}
                        </span>
                      )}
                      {step.endTime && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          Bitiş: {new Date(step.endTime).toLocaleTimeString('tr-TR')}
                        </span>
                      )}
                      {step.duration && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          Süre: {formatDuration(step.duration)}
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {step.error && (
                      <div style={{ 
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <AlertCircle size={14} color="#dc2626" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626' }}>
                            Hata Detayı
                          </span>
                        </div>
                        <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>
                          {step.error}
                        </p>
                      </div>
                    )}

                    {/* Screenshot Link */}
                    {step.screenshot && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a 
                          href={`http://localhost:3001${step.screenshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #bfdbfe',
                            fontWeight: 500
                          }}
                        >
                          <Image size={14} />
                          Ekran Görüntüsünü Aç
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

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Test Kayıtlarını Sil"
        message={`${selectedTests.size} test kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
} 