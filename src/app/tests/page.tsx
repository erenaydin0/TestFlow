'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Filter,
  Plus,
  MoreVertical,
  Tag,
  Clock,
  Copy,
  FileText,
  AlertCircle,
  Download,
  Upload,
  Search,
  X
} from 'lucide-react';
import { formatDuration, formatRelativeTime, getSavedWorkflows, deleteWorkflow, duplicateWorkflow, exportTestWorkflow } from '@/lib/utils';
import { Test } from '@/types';
import ImportDialog from '@/components/test-builder/ImportDialog';
import { useTestNotifications } from '@/hooks/useTestNotifications';

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [suiteFilter, setSuiteFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { notifyTestStart, notifyTestImported, notifyTestFailure, notifyTestDeleted, notifyTestDuplicated } = useTestNotifications();

  // Load saved workflows
  useEffect(() => {
    const loadTests = () => {
      try {
        const savedWorkflows = getSavedWorkflows();
        setTests(savedWorkflows);
      } catch (error) {
        console.error('Error loading tests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  // Handle URL search parameter
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchFilter(searchQuery);
    }
  }, [searchParams]);

  // Filter tests based on search and suite
  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchFilter || 
      test.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      test.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      test.tags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesSuite = !suiteFilter || test.suite === suiteFilter;
    return matchesSearch && matchesSuite;
  });

  // Get unique suites for filter dropdown
  const uniqueSuites = Array.from(new Set(tests.map(test => test.suite)));

  // Handle test selection
  const handleTestSelection = (testId: string, checked: boolean) => {
    const newSelection = new Set(selectedTests);
    if (checked) {
      newSelection.add(testId);
    } else {
      newSelection.delete(testId);
    }
    setSelectedTests(newSelection);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests(new Set(filteredTests.map(test => test.id)));
    } else {
      setSelectedTests(new Set());
    }
  };

  // Handle run test - Updated to use backend API
  const handleRunTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test || !test.workflow || test.workflow.length === 0) {
      notifyTestFailure(test?.name || 'Bilinmeyen Test', testId, 'Test workflow\'u bulunamadı veya boş.');
      return;
    }

    try {
      // Convert frontend steps to backend format
      const backendSteps = test.workflow.map(step => ({
        id: step.id,
        type: step.type,
        config: {
          url: step.url,
          selector: step.selector,
          value: step.value,
          text: step.value, // For type actions
          target: step.selector, // Alternative selector name
          duration: step.duration,
          condition: step.condition,
          expectedValue: step.expectedValue,
          direction: step.direction,
          amount: step.amount,
          filename: step.filename,
          key: step.key
        }
      }));
      
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: test.id,
          workflowName: test.name,
          steps: backendSteps,
          suite: test.suite,
          tags: test.tags,
          options: {
            enableScreenshots: test.enableScreenshots || false,
            enableRecording: test.enableRecording || false,
            headlessMode: test.headlessMode || false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      notifyTestStart(test.name, data.executionId);
      
    } catch (error) {
      console.error('Test execution error:', error);
      notifyTestFailure(test.name, testId, error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  };

  // Handle edit test
  const handleEditTest = (testId: string) => {
    // Navigate to test builder with the workflow loaded
    router.push(`/test-builder?load=${testId}`);
  };

  // Handle duplicate test
  const handleDuplicateTest = async (testId: string) => {
    try {
      const test = tests.find(t => t.id === testId);
      const duplicatedId = duplicateWorkflow(testId);
      if (duplicatedId && test) {
        // Reload tests
        const updatedTests = getSavedWorkflows();
        setTests(updatedTests);
        notifyTestDuplicated(test.name, duplicatedId);
      }
    } catch (error) {
      const test = tests.find(t => t.id === testId);
      notifyTestFailure(test?.name || 'Bilinmeyen Test', testId, 'Test kopyalanırken hata oluştu.');
    }
  };

  // Handle delete test
  const handleDeleteTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test && confirm(`"${test.name}" testini silmek istediğinizden emin misiniz?`)) {
      try {
        if (deleteWorkflow(testId)) {
          // Reload tests
          const updatedTests = getSavedWorkflows();
          setTests(updatedTests);
          setSelectedTests(prev => {
            const newSelection = new Set(prev);
            newSelection.delete(testId);
            return newSelection;
          });
          notifyTestDeleted(test.name, testId);
        }
      } catch (error) {
        notifyTestFailure(test.name, testId, 'Test silinirken hata oluştu.');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTests.size === 0) return;
    
    if (confirm(`${selectedTests.size} testi silmek istediğinizden emin misiniz?`)) {
      try {
        let deletedCount = 0;
        selectedTests.forEach(testId => {
          if (deleteWorkflow(testId)) {
            deletedCount++;
          }
        });
        
        // Reload tests
        const updatedTests = getSavedWorkflows();
        setTests(updatedTests);
        setSelectedTests(new Set());
        alert(`${deletedCount} test başarıyla silindi!`);
      } catch (error) {
        alert('Testler silinirken hata oluştu.');
      }
    }
  };

  // Handle bulk run - Updated to use backend API
  const handleBulkRun = async () => {
    if (selectedTests.size === 0) return;
    
    const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
    const validTests = selectedTestsData.filter(test => test.workflow && test.workflow.length > 0);
    
    if (validTests.length === 0) {
      alert('Seçilen testlerde çalıştırılabilir workflow bulunamadı.');
      return;
    }

    try {
      const executionPromises = validTests.map(async (test) => {
        // Convert frontend steps to backend format
        const backendSteps = test.workflow!.map(step => ({
          id: step.id,
          type: step.type,
          config: {
            url: step.url,
            selector: step.selector,
            value: step.value,
            text: step.value, // For type actions
            target: step.selector, // Alternative selector name
            duration: step.duration,
            condition: step.condition,
            expectedValue: step.expectedValue,
            direction: step.direction,
            amount: step.amount,
            filename: step.filename,
            key: step.key
          }
        }));
        
        const response = await fetch('http://localhost:3001/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: test.id,
            workflowName: test.name,
            steps: backendSteps,
            suite: test.suite,
            tags: test.tags,
            options: {
              enableScreenshots: test.enableScreenshots || false,
              enableRecording: test.enableRecording || false,
              headlessMode: test.headlessMode || false
            }
          })
        });

        if (!response.ok) {
          throw new Error(`${test.name}: HTTP error! status: ${response.status}`);
        }

        return await response.json();
      });

      const results = await Promise.all(executionPromises);
      const executionIds = results.map(r => r.executionId).join('\n');
      
      alert(`${validTests.length} test başarıyla çalıştırılmaya başlandı!\n\nExecution IDs:\n${executionIds}`);
      
    } catch (error) {
      console.error('Bulk test execution error:', error);
      alert(`Testler çalıştırılırken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}\n\nBackend server'ın çalıştığından emin olun.`);
    }
  };

  // Navigate to test builder
  const handleCreateNewTest = () => {
    router.push('/test-builder');
  };

  // Handle single test export
  const handleExportTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test && test.workflow) {
      try {
        exportTestWorkflow(test.workflow, `${test.name}.json`);
        alert(`"${test.name}" başarıyla export edildi!`);
      } catch (error) {
        alert('Export işlemi sırasında hata oluştu.');
      }
    }
  };

  // Handle bulk export (selected tests)
  const handleBulkExport = () => {
    if (selectedTests.size === 0) {
      alert('Export edilecek test seçin.');
      return;
    }

    const selectedTestsData = tests.filter(test => selectedTests.has(test.id));
    
    if (selectedTestsData.length === 1) {
      // Single test export
      const test = selectedTestsData[0];
      if (test.workflow) {
        exportTestWorkflow(test.workflow, `${test.name}.json`);
        alert(`"${test.name}" başarıyla export edildi!`);
      }
    } else {
      // Multiple tests export
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'multiple-workflows',
        workflows: selectedTestsData.map(test => ({
          name: test.name,
          description: test.description,
          steps: test.workflow || [],
          tags: test.tags,
          suite: test.suite,
          metadata: {
            createdAt: test.createdAt,
            updatedAt: test.updatedAt,
            originalId: test.id
          }
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileName = `testflow-workflows-${selectedTestsData.length}-tests-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();

      alert(`${selectedTestsData.length} test başarıyla export edildi!`);
    }
  };

  // Handle import
  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  // Handle import success
  const handleImportSuccess = (importedCount: number) => {
    // Reload tests after successful import
    const updatedTests = getSavedWorkflows();
    setTests(updatedTests);
    setIsImportDialogOpen(false);
    notifyTestImported(`${importedCount} workflow`, '');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <div style={{ 
          flex: 1, 
          marginLeft: '16rem',
          paddingTop: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Yükleniyor...</div>
            <div style={{ fontSize: '0.875rem' }}>Kaydedilen testler yükleniyor</div>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Header with stats */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'var(--text-primary)', 
                margin: 0 
            }}>
              Kayıtlı Testler
            </h1>
            <p style={{ 
                color: 'var(--text-secondary)', 
                margin: '0.5rem 0 0 0' 
            }}>
              Toplam {tests.length} kayıtlı test bulunuyor • {filteredTests.length} gösteriliyor
            </p>
          </div>

          {/* Tests List */}
          <div className="card">
          <div style={{ 
            display: 'flex', 
              justifyContent: 'space-between', 
            alignItems: 'center',
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
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
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

                {/* Suite Filter */}
                <select
                  value={suiteFilter}
                  onChange={(e) => setSuiteFilter(e.target.value)}
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
                  <option value="">Tüm Test Grupları</option>
                  {uniqueSuites.map(suite => (
                    <option key={suite} value={suite}>{suite}</option>
                  ))}
                </select>

                {/* Clear Filters Button */}
                {(searchFilter || suiteFilter) && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setSuiteFilter('');
                    }}
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
                {/* Import/Export Buttons */}
                <button 
                  onClick={handleImport}
                  style={{
                    padding: '0.375rem 0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <Upload size={12} />
                  İçe Aktar
                </button>

                {selectedTests.size > 0 && (
                  <>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {selectedTests.size} test seçili
                    </span>
                    <button 
                      onClick={handleBulkExport}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #2563eb',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                    >
                      <Download size={12} />
                      Dışa Aktar
                    </button>
                    <button 
                      onClick={handleBulkRun}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #059669',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        color: '#059669',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Çalıştır
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #dc2626',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      Sil
                    </button>
                    <button
                      onClick={() => setSelectedTests(new Set())}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.5rem',
                        backgroundColor: '#6b7280',
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
                  </>
                )}
                
                <button 
                  onClick={handleCreateNewTest}
                  className="btn-primary" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem'
                  }}
                >
                  <Plus size={12} />
                  Yeni Test
                </button>
              </div>
            </div>
          </div>

            {filteredTests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <FileText size={24} color="var(--text-secondary)" />
              </div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0'
              }}>
                {tests.length === 0 ? 'Henüz test workflow\'u yok' : 'Filtreye uygun test bulunamadı'}
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                margin: '0 0 1.5rem 0'
              }}>
                {tests.length === 0 
                  ? 'Test builder\'da ilk workflow\'unuzu oluşturun'
                  : 'Farklı filtreler deneyerek aradığınız testleri bulabilirsiniz'
                }
              </p>
              <button 
                onClick={handleCreateNewTest}
                className="btn-primary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                <Plus size={16} />
                İlk Test Workflow'unu Oluştur
              </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      <input 
                        type="checkbox" 
                          checked={selectedTests.size === filteredTests.length && filteredTests.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{ 
                          borderRadius: '0.25rem', 
                          border: '1px solid var(--border-primary)' 
                        }} 
                      />
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Adı
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Test Grubu
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                        Adım Sayısı
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                        Oluşturulma
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      Etiketler
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                    {filteredTests.map((test) => (
                    <tr 
                      key={test.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                            checked={selectedTests.has(test.id)}
                            onChange={(e) => handleTestSelection(test.id, e.target.checked)}
                          style={{ 
                            borderRadius: '0.25rem', 
                            border: '1px solid var(--border-primary)' 
                          }} 
                        />
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <h3 style={{ 
                            fontWeight: 500, 
                            color: 'var(--text-primary)',
                            margin: 0,
                            fontSize: '0.875rem'
                          }}>
                            {test.name}
                          </h3>
                                                     <p style={{ 
                             fontSize: '0.75rem', 
                             color: 'var(--text-secondary)', 
                             margin: '0.25rem 0 0 0'
                           }}>
                            {test.description}
                          </p>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                          {test.suite}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                            <FileText size={16} />
                            <span>{test.workflow?.length || 0} adım</span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)' 
                        }}>
                            {formatRelativeTime(test.createdAt)}
                        </span>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {test.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
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
                          {test.tags.length > 2 && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-tertiary)' 
                            }}>
                              +{test.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleRunTest(test.id)}
                              style={{ 
                              padding: '0.25rem', 
                              color: '#059669', 
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Testi Çalıştır"
                            >
                              <Play size={16} />
                            </button>
                          
                            <button 
                              onClick={() => handleEditTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
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
                              title="Testi Düzenle"
                            >
                            <Edit size={16} />
                          </button>
                          
                            <button 
                              onClick={() => handleExportTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                                color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
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
                              title="Testi Dışa Aktar"
                            >
                              <Download size={16} />
                          </button>
                          
                            <button 
                              onClick={() => handleDuplicateTest(test.id)}
                              style={{ 
                            padding: '0.25rem', 
                            color: 'var(--text-secondary)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
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
                              title="Testi Kopyala"
                            >
                              <Copy size={16} />
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteTest(test.id)}
                              style={{ 
                                padding: '0.25rem', 
                                color: '#dc2626', 
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Testi Sil"
                            >
                              <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
        </main>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
} 