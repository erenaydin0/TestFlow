'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, 
  Image,
  Video,
  RefreshCw,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  FileText,
  Tag,
  Chrome,
  Globe
} from 'lucide-react';

import PageLayout from '@/components/layout/PageLayout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import DataFilters from '@/components/common/DataFilters';
import DataTable, { Column } from '@/components/common/DataTable';
import TableCells from '@/components/common/TableCells';
import { StatsCards } from '@/components/features/dashboard';
import { UnifiedStepView } from '@/components/features/reports';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { Button, IconButton, ButtonGroup } from '@/components/ui';

import { ExecutionResult, ExecutionFilters, ExecutionStats, BrowserType } from '@/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { StatusBadge, getStatusColor, getStatusText } from '@/components/common';
import { useTestNotifications, useReports } from '@/hooks';
import { useSidebar } from '@/contexts';

const { BrowserCell, TagsCell, ActionsCell, StatusCell, DurationCell, TestNameCell, SuccessRateCell } = TableCells;

type SortField = 'startTime' | 'duration' | 'workflowName' | 'status' | 'successRate' | 'suite' | 'tags' | 'browserType';

export default function ReportsPage() {
  const { setIsModalOpen } = useSidebar();
  const {
    executions,
    filteredExecutions,
    sortedExecutions,
    loading,
    error,
    stats,
    filteredStats,
    filters,
    setFilters,
    filterOptions,
    hasActiveFilters,
    clearFilters,
    sortField,
    sortOrder,
    handleSort,
    selectedExecutions,
    setSelectedExecutions,
    refresh,
    deleteExecution,
    bulkDeleteExecutions
  } = useReports();

  const [selectedExecution, setSelectedExecution] = useState<ExecutionResult | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { notifyTestDeleted, notifyTestFailure } = useTestNotifications();
  
  const [highlightedExecutionId, setHighlightedExecutionId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Execution flow helper functions
  const getExecutionPath = (execution: ExecutionResult): string[] => {
    const path: string[] = [];
    const stepMap = new Map();
    execution.steps.forEach((step, index) => {
      stepMap.set(step.stepId, { step, index });
    });

    // Find start step (step with no incoming connections)
    const hasIncomingConnection = new Set();
    execution.steps.forEach(step => {
      if (step.config.connections) {
        step.config.connections.forEach(targetId => hasIncomingConnection.add(targetId));
      }
      if (step.config.trueConnection) {
        hasIncomingConnection.add(step.config.trueConnection);
      }
      if (step.config.falseConnection) {
        hasIncomingConnection.add(step.config.falseConnection);
      }
    });

    let currentStepId = execution.steps.find(s => !hasIncomingConnection.has(s.stepId))?.stepId;
    const visitedSteps = new Set();
    const maxIterations = execution.steps.length * 10;
    let iterations = 0;

    while (currentStepId && iterations < maxIterations) {
      iterations++;
      
      if (visitedSteps.has(currentStepId)) {
        break; // Prevent infinite loops
      }
      visitedSteps.add(currentStepId);
      path.push(currentStepId);

      const currentStepData = stepMap.get(currentStepId);
      if (!currentStepData) break;

      const { step } = currentStepData;
      
      // Determine next step based on step type and connections
      let nextStepId = null;
      
      // Handle IF step conditional navigation
      if (step.type === 'if' && step.conditionResult !== undefined) {
        // Gerçek koşul sonucuna göre yön belirle
        nextStepId = step.conditionResult 
          ? step.config.trueConnection 
          : step.config.falseConnection;
      }
      // Handle normal connections (non-IF steps)
      else if (step.type !== 'if' && step.config.connections && step.config.connections.length > 0) {
        nextStepId = step.config.connections[0];
      }

      currentStepId = nextStepId;
    }

    return path;
  };

  const getConditionResults = (execution: ExecutionResult): Map<string, boolean> => {
    const results = new Map<string, boolean>();
    
    // Gerçek conditionResult'ı kullan
    execution.steps.forEach(step => {
      if (step.type === 'if' && step.conditionResult !== undefined) {
        results.set(step.stepId, step.conditionResult);
      }
    });

    return results;
  };

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const suiteParam = searchParams.get('suite');
    const browserParam = searchParams.get('browser');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (searchQuery || suiteParam || browserParam || dateParam || startDateParam || endDateParam) {
      setFilters(prev => ({
        ...prev,
        ...(searchQuery && { search: searchQuery }),
        ...(suiteParam && { suite: [suiteParam] }),
        ...(browserParam && { browserType: [browserParam as BrowserType] }),
        ...(dateParam && { specificDate: dateParam, dateRange: '', startDate: '', endDate: '' }), // Tek tarih
        ...(startDateParam && endDateParam && { 
          startDate: startDateParam, 
          endDate: endDateParam, 
          specificDate: '', 
          dateRange: '' 
        }) // Tarih aralığı
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

  // Handle test ID parameter to find and open related execution modal
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && executions.length > 0) {
      console.log('Looking for testId:', testId);
      console.log('Available executions:', executions.map(e => ({ id: e.id, workflowId: e.workflowId, workflowName: e.workflowName })));
      
      // Test ID'sine göre en son execution'ı bulalım - daha geniş filtreleme
      const testExecutions = executions.filter(e => 
        e.workflowId === testId || 
        e.workflowName.toLowerCase().includes(testId.toLowerCase()) ||
        e.id.includes(testId)
      );
      
      console.log('Matching executions:', testExecutions);
      
      if (testExecutions.length > 0) {
        // En son çalıştırılan execution'ı seç
        const latestExecution = testExecutions.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];
        console.log('Selected execution:', latestExecution);
        setSelectedExecution(latestExecution);
      } else {
        // Eğer testId ile eşleşen bir execution bulunamadıysa, en son execution'ı seç
        console.log('No matching executions found for testId, selecting latest execution');
        const latestExecution = executions.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];
        if (latestExecution) {
          console.log('Selected latest execution:', latestExecution);
          setSelectedExecution(latestExecution);
        }
      }
    }
  }, [searchParams, executions]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedExecution) {
        setSelectedExecution(null);
      }
    };

    if (selectedExecution) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedExecution]);

  // Update sidebar state when modal opens/closes
  useEffect(() => {
    setIsModalOpen(!!selectedExecution);
  }, [selectedExecution, setIsModalOpen]);

  // Define table columns for DataTable
  const columns: Column<ExecutionResult>[] = [
    {
      key: 'workflowName',
      label: 'Test Adı',
      sortable: true,
      render: (value, execution) => (
        <TestNameCell 
          name={execution.workflowName} 
          id={execution.id}
        />
      )
    },
    {
      key: 'status',
      label: 'Durum',
      sortable: true,
      width: '100px',
      render: (value, execution) => (
        <StatusCell status={execution.status} size="sm" />
      )
    },
    {
      key: 'successRate',
      label: 'Başarı',
      sortable: true,
      width: '100px',
      render: (value, execution) => (
        <SuccessRateCell rate={execution.successRate} />
      )
    },
    {
      key: 'startTime',
      label: 'Başlangıç',
      sortable: true,
      width: '150px',
      render: (value, execution) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {formatRelativeTime(execution.startTime)}
        </span>
      )
    },
    {
      key: 'duration',
      label: 'Süre',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value, execution) => (
        <DurationCell duration={execution.duration} />
      )
    },
    {
      key: 'suite',
      label: 'Test Grubu',
      width: '200px',
      sortable: true,
      render: (value) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'tags',
      label: 'Etiketler',
      sortable: true,
      width: '250px',
      render: (value, execution) => (
        <TagsCell tags={execution.tags || []} maxVisible={2} />
      )
    },
    {
      key: 'browserType',
      label: 'Tarayıcı',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value, execution) => (
        <BrowserCell browserType={execution.options?.browserType} />
      )
    },
    {
      key: 'actions',
      label: 'Rapor',
      sortable: false,
      width: '80px',
      render: (value, execution) => (
        <ActionsCell
          onDownload={() => downloadSingleExecution(execution)}
        />
      )
    }
  ];

  // Pagination logic
  const totalItems = sortedExecutions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageExecutions = sortedExecutions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortOrder]);

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
      'Tarayıcı',
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
        (() => {
          const browserType = execution.options?.browserType || 'chromium';
          switch(browserType) {
            case 'chromium': return 'Chrome';
            case 'firefox': return 'Firefox';
            case 'webkit': return 'Safari';
            case 'msedge': return 'Edge';
            default: return 'Chrome';
          }
        })(),
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${step.screenshot}`);
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
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${execution.videoPath}`);
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


  const downloadSelectedTests = async () => {
    if (selectedExecutions.size === 0) return;
    
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const selectedExecutionsList = sortedExecutions.filter(e => selectedExecutions.has(e.id));
      
      // Create main CSV report
      const csvContent = createTestCSVReport(selectedExecutionsList);
      zip.file('toplu_test_raporu.csv', '\uFEFF' + csvContent);
      
      // Create consolidated steps CSV
      const allStepsCSV = createBulkStepsCSVReport(selectedExecutionsList);
      zip.file('tum_adim_detaylari.csv', '\uFEFF' + allStepsCSV);
      
      // Add screenshots and videos for each execution
      for (let execIndex = 0; execIndex < selectedExecutionsList.length; execIndex++) {
        const execution = selectedExecutionsList[execIndex];
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
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${step.screenshot}`);
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${execution.videoPath}`);
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
      a.download = `CosmicQA_TopluRapor_${new Date().toISOString().split('T')[0]}_${selectedExecutions.size}test.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Clear selection
      setSelectedExecutions(new Set());
      
    } catch (error) {
      console.error('Error creating bulk report package:', error);
      notifyTestFailure('Bulk Download', '', 'Toplu rapor paketi oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const deleteSelectedTests = async () => {
    if (selectedExecutions.size === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletedCount = await bulkDeleteExecutions(Array.from(selectedExecutions));
      
      // Clear selection
      setSelectedExecutions(new Set());
      
      // Close dialog
      setShowBulkDeleteDialog(false);
      
      notifyTestDeleted(`${deletedCount} test kaydı`, '');
    } catch (error) {
      console.error('Error deleting tests:', error);
      notifyTestFailure('Bulk Delete', '', 'Testler silinirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  return (
    <PageLayout
      title="Test Sonuçları"
      subtitle={`Çalıştırılan testlerin detaylı sonuçları${hasActiveFilters ? ` (${sortedExecutions.length} / ${executions.length} sonuç)` : ''}`}
    >
      <LoadingErrorState
        loading={loading}
        error={error}
        loadingMessage="Test sonuçları yükleniyor..."
        onRetry={refresh}
      >
        {/* Stats Overview */}
          <StatsCards stats={filteredStats} loading={loading} />

          {/* Executions List */}
          <div className="card">
          <div style={{ 
            display: 'flex', 
              justifyContent: 'space-between', 
            alignItems: 'center',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <DataFilters
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    setFilters(newFilters);
                    
                    // URL'i güncelle
                    const params = new URLSearchParams();
                    if (newFilters.search) params.set('search', newFilters.search);
                    if (newFilters.status) params.set('status', newFilters.status);
                    if (newFilters.suite.length > 0) params.set('suite', newFilters.suite.join(','));
                    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
                    if (newFilters.browserType.length > 0) params.set('browser', newFilters.browserType.join(','));
                    if (newFilters.startDate && newFilters.endDate) {
                      params.set('startDate', newFilters.startDate);
                      params.set('endDate', newFilters.endDate);
                    } else if (newFilters.specificDate) {
                      params.set('date', newFilters.specificDate);
                    }
                    
                    const queryString = params.toString();
                    router.push(queryString ? `/reports?${queryString}` : '/reports', { scroll: false });
                  }}
                  availableOptions={{
                    suites: filterOptions.suites,
                    tags: filterOptions.tags,
                    browsers: filterOptions.browsers,
                    statuses: filterOptions.statuses
                  }}
                  searchPlaceholder="Test adı..."
                  showStatus={true}
                  showDateRange={true}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedExecutions.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {selectedExecutions.size} test seçili
                    </span>
                    <ButtonGroup spacing="sm">
                      <Button
                        variant="success"
                        size="sm"
                        icon={Download}
                        onClick={downloadSelectedTests}
                      >
                        Seçilenleri İndir
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={deleteSelectedTests}
                      >
                        Sil
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={X}
                        onClick={() => setSelectedExecutions(new Set())}
                      >
                        Seçimi Temizle
                      </Button>
                    </ButtonGroup>
                  </div>
                )}
              </div>
            </div>

            {/* Old filters section removed - now using DataFilters component above */}

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
                color: 'var(--status-error)'
              }}>
                <AlertCircle size={24} />
                <span style={{ marginLeft: '0.5rem' }}>Hata: {error}</span>
            </div>
            ) : sortedExecutions.length === 0 ? (
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
              <div>
                <DataTable
                  data={currentPageExecutions}
                  allData={sortedExecutions}
                  columns={columns}
                  loading={loading}
                  emptyMessage="Sonuç bulunamadı"
                  selectable={true}
                  selectedItems={selectedExecutions}
                  onSelectionChange={setSelectedExecutions}
                  getItemId={(execution) => execution.id}
                  highlightedItemId={highlightedExecutionId}
                  onSort={(field: string, order: 'asc' | 'desc') => {
                    handleSort(field as SortField);
                  }}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onRowClick={(execution) => setSelectedExecution(execution)}
                />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.5rem',
                    padding: '0.75rem 0',
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
                          <span>{totalItems} toplam sonuç</span>
                        </>
                      ) : (
                        'Sonuç bulunamadı'
                      )}
                    </div>

                    {/* Pagination Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '0.375rem',
                          backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="İlk sayfa"
                      >
                        <ChevronsLeft size={14} />
                      </button>

                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '0.375rem',
                          backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="Önceki sayfa"
                      >
                        <ChevronLeft size={14} />
                      </button>

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
                              <button
                                key={i}
                                onClick={() => goToPage(i)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2rem',
                                  height: '2rem',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: '0.375rem',
                                  backgroundColor: i === currentPage ? 'var(--color-selected)' : 'var(--bg-primary)',
                                  color: i === currentPage ? 'white' : 'var(--text-primary)',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: i === currentPage ? '600' : '400',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {i}
                              </button>
                            );
                          }
                          return pages;
                        })()}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '0.375rem',
                          backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="Sonraki sayfa"
                      >
                        <ChevronRight size={14} />
                      </button>

                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '0.375rem',
                          backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="Son sayfa"
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
                        </div>
                      
      {/* Execution Details Modal */}
      {selectedExecution && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={() => setSelectedExecution(null)}
        >
          <div 
            style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
                        {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                {/* Test Adı, StatusBadge, Başarı Oranı */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: 'var(--text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 600
                  }}>
                    {selectedExecution.workflowName}
                  </h3>
                  <StatusBadge status={selectedExecution.status} size="md" />
                  {selectedExecution.successRate !== undefined && (
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: selectedExecution.successRate >= 80 ? 'var(--status-success)' : selectedExecution.successRate >= 50 ? 'var(--status-warning)' : 'var(--status-error)'
                    }}>
                      {selectedExecution.successRate}%
                    </span>
                  )}
                </div>
                
                {/* ID */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace'
                  }}>
                    ID: {selectedExecution.id}
                  </span>
                </div>
                
                {/* Başlangıç, Bitiş, Süre */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <strong>Başlangıç:</strong> {new Date(selectedExecution.startTime).toLocaleString('tr-TR')}
                  </div>
                  {selectedExecution.endTime && (
                    <div>
                      <strong>Bitiş:</strong> {new Date(selectedExecution.endTime).toLocaleString('tr-TR')}
                    </div>
                  )}
                  {selectedExecution.duration && (
                    <div>
                      <strong>Süre:</strong> {formatDuration(selectedExecution.duration)}
                    </div>
                  )}
                </div>
                
                {/* Test Metadata */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {/* Browser */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Tarayıcı:</strong>
                    {(() => {
                      const browserType = selectedExecution.options?.browserType || 'chromium';
                      const getBrowserIcon = () => {
                        switch(browserType) {
                          case 'chromium': return <Chrome size={14} style={{ color: 'var(--status-info)' }} />;
                          case 'firefox': return <Globe size={14} style={{ color: 'var(--status-warning)' }} />;
                          case 'webkit': return <Globe size={14} style={{ color: 'var(--status-info)' }} />;
                          case 'msedge': return <Globe size={14} style={{ color: 'var(--status-info)' }} />;
                          default: return <Chrome size={14} style={{ color: 'var(--status-info)' }} />;
                        }
                      };
                      const getBrowserName = () => {
                        switch(browserType) {
                          case 'chromium': return 'Chrome';
                          case 'firefox': return 'Firefox';
                          case 'webkit': return 'Safari';
                          case 'msedge': return 'Edge';
                          default: return 'Chrome';
                        }
                      };
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {getBrowserIcon()}
                          <span>{getBrowserName()}</span>
                        </div>
                      );
                    })()} 
                  </div>
                  
                  {/* Suite */}
                  {selectedExecution.suite && (
                    <div>
                      <strong>Test Grubu:</strong> {selectedExecution.suite}
                    </div>
                  )}
                  
                  {/* Tags */}
                  {selectedExecution.tags && selectedExecution.tags.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>Etiketler:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {selectedExecution.tags.map((tag, index) => (
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
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Test Options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {selectedExecution.options?.headlessMode && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-secondary)'
                      }}>
                        Headless
                      </span>
                    )}
                    {selectedExecution.options?.enableScreenshots && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: 'var(--status-success-bg)',
                        color: 'var(--status-success)',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--status-success)'
                      }}>
                        <Image size={10} />
                        Screenshots
                      </span>
                    )}
                    {selectedExecution.options?.enableRecording && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: 'var(--status-error-bg)',
                        color: 'var(--status-error)',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--status-error)'
                      }}>
                        <Video size={10} />
                        Recording
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <ButtonGroup spacing="sm">
                <IconButton
                  icon={Download}
                  variant="ghost"
                  size="md"
                  tooltip="Raporu İndir"
                  onClick={() => downloadSingleExecution(selectedExecution)}
                />
                <IconButton
                  icon={X}
                  variant="ghost"
                  size="md"
                  tooltip="Kapat"
                  onClick={() => setSelectedExecution(null)}
                />
              </ButtonGroup>
            </div>

            {/* Unified Step View */}
            <UnifiedStepView 
              steps={selectedExecution.steps}
              executionPath={getExecutionPath(selectedExecution)}
              conditionResults={getConditionResults(selectedExecution)}
            />
              
            {/* Screenshots and Video */}
            {(selectedExecution.screenshots.length > 0 || selectedExecution.videoPath) && (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Video butonu başta */}
                  {selectedExecution.videoPath && (
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${selectedExecution.videoPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--status-error-bg)',
                        color: 'var(--status-error)',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        border: '1px solid var(--status-error)',
                        fontWeight: 500
                      }}
                    >
                      <Video size={16} />
                      Video Kaydını İzle
                    </a>
                  )}
                  {/* Screenshot butonları */}
                  {selectedExecution.screenshots.map((screenshot, index) => (
                    <a 
                      key={index}
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${screenshot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--status-purple-bg)',
                        color: 'var(--status-purple)',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        border: '1px solid var(--status-purple)',
                        fontWeight: 500
                      }}
                    >
                      <Image size={16} />
                      Screenshot {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

      </div>
      )}
      </LoadingErrorState>

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Test Kayıtlarını Sil"
        message={`${selectedExecutions.size} test kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </PageLayout>
  );
} 