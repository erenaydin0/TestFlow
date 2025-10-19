'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, AlertCircle, FileText, CheckCircle, Info, Globe, Chrome } from 'lucide-react';
import { importTestWorkflow } from '@/utils/fileUtils';
import { saveWorkflowToStorage } from '@/utils/fileUtils';
import { Button, ButtonGroup, IconButton } from '@/components';
import { useNotifications } from '@/hooks';
import { BrowserType, TestFormData } from '@/types';
import { TestService } from '@/utils/api';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number) => void;
}

interface ImportPreview {
  name: string;
  description: string;
  stepCount: number;
  tags: string[];
  suite: string;
  browserType?: BrowserType;
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
  isValid: boolean;
  errors: string[];
  willOverwrite: boolean;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const { notifyTestFailure } = useNotifications();
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPreviews([]);
      setImportResults(null);
      setImporting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const jsonFiles = files.filter(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      notifyTestFailure(('common.import'), '', ('testBuilder.selectValidJsonFiles'));
      return;
    }

    const newPreviews: ImportPreview[] = [];
    const workflowsData: any[] = []; // Store actual workflow data

    for (const file of jsonFiles) {
      try {
        const content = await readFileContent(file);
        const parsed = JSON.parse(content);
        
        // Handle different import formats
        if (parsed.exportType === 'multiple-workflows' && parsed.workflows) {
          // Multiple workflows from bulk export
          for (const workflow of parsed.workflows) {
            const preview = createPreview(workflow, file.name);
            newPreviews.push(preview);
            workflowsData.push(workflow); // Store actual data
          }
        } else if (parsed.steps && Array.isArray(parsed.steps)) {
          // Single workflow from test builder
          const workflowData = {
            name: parsed.name || file.name.replace('.json', ''),
            description: parsed.description || '',
            steps: parsed.steps,
            tags: parsed.metadata?.tags || parsed.tags || [],
            suite: parsed.metadata?.suite || parsed.suite || 'Imported',
            browserType: parsed.metadata?.browserType || parsed.browserType || 'chromium',
            enableScreenshots: parsed.metadata?.enableScreenshots || parsed.enableScreenshots || false,
            enableRecording: parsed.metadata?.enableRecording || parsed.enableRecording || false,
            headlessMode: parsed.metadata?.headlessMode || parsed.headlessMode || false
          };
          const preview = createPreview(workflowData, file.name);
          newPreviews.push(preview);
          workflowsData.push(workflowData); // Store actual data
                  } else {
            // Try to parse as test builder format
            try {
              const result = await importTestWorkflow(file);
              const workflowData = {
                name: result.name || file.name.replace('.json', ''),
                description: result.metadata?.description || '',
                steps: result.steps,
                tags: result.metadata?.tags || [],
                suite: result.metadata?.suite || 'Imported',
                browserType: result.metadata?.browserType || 'chromium',
                enableScreenshots: result.metadata?.enableScreenshots || false,
                enableRecording: result.metadata?.enableRecording || false,
                headlessMode: result.metadata?.headlessMode || false
              };
              const preview = createPreview(workflowData, file.name);
              newPreviews.push(preview);
              workflowsData.push(workflowData); // Store actual data
            } catch (importError) {
              newPreviews.push({
                name: file.name,
                description: 'Dosya okunamadı',
                stepCount: 0,
                tags: [],
                suite: '',
                isValid: false,
                browserType: 'chromium',
                enableScreenshots: false,
                enableRecording: false,
                headlessMode: false,
                errors: [`Import hatası: ${importError instanceof Error ? importError.message : 'Bilinmeyen hata'}`],
                willOverwrite: false
              });
            }
          }
      } catch (error) {
        newPreviews.push({
          name: file.name,
          description: 'Dosya okunamadı',
          stepCount: 0,
          tags: [],
          suite: '',
          isValid: false,
          errors: [`Dosya formatı geçersiz: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
          willOverwrite: false
        });
      }
    }

    setPreviews(newPreviews);
    // Store workflow data for later use
    (window as any).tempWorkflowsData = workflowsData;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Dosya okuma hatası'));
      reader.readAsText(file);
    });
  };

  const createPreview = (workflow: any, fileName: string): ImportPreview => {
    const errors: string[] = [];
    
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push('Workflow adı gereklidir');
    }
    
    if (!workflow.steps || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
      errors.push('En az bir test adımı gereklidir');
    }

    // Check if workflow with same name exists
    const existingWorkflows = JSON.parse(localStorage.getItem('CosmicQA_saved_workflows') || '[]');
    const willOverwrite = existingWorkflows.some((w: any) => w.name === workflow.name);

    return {
      name: workflow.name || fileName.replace('.json', ''),
      description: workflow.description || '',
      stepCount: workflow.steps ? workflow.steps.length : 0,
      tags: workflow.tags || [],
      suite: workflow.suite || 'Imported',
      browserType: workflow.browserType || 'chromium',
      enableScreenshots: workflow.enableScreenshots || false,
      enableRecording: workflow.enableRecording || false,
      headlessMode: workflow.headlessMode || false,
      isValid: errors.length === 0,
      errors,
      willOverwrite
    };
  };

  const handleImport = async () => {
    const validPreviews = previews.filter(p => p.isValid);
    
    if (validPreviews.length === 0) {
      notifyTestFailure('Import', '', 'Import edilecek geçerli workflow bulunamadı.');
      return;
    }

    const workflowsData = (window as any).tempWorkflowsData || [];
    
    setImporting(true);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < validPreviews.length; i++) {
      const preview = validPreviews[i];
      const workflowData = workflowsData[i];
      
      if (!workflowData) {
        failed++;
        continue;
      }

      try {
        // Backend'e kaydet
        await TestService.createTest({
          name: preview.name,
          description: preview.description,
          workflow: workflowData.steps || [],
          tags: preview.tags,
          suite: preview.suite,
          browserType: preview.browserType,
          enableScreenshots: preview.enableScreenshots,
          enableRecording: preview.enableRecording,
          headlessMode: preview.headlessMode,
          isExecutable: true,
          status: 'pending' as const,
          duration: 0
        });

        success++;
      } catch (error) {
        console.error('Test import hatası:', error);
        failed++;
      }
    }

    // Clean up temporary data
    delete (window as any).tempWorkflowsData;

    setImportResults({ success, failed, skipped });
    setImporting(false);
    
    if (success > 0) {
      onImportSuccess(success);
    }
  };

  const handleClose = () => {
    setPreviews([]);
    setImportResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 1000
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: 'var(--status-primary-bg)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={18} style={{ color: 'var(--status-primary)' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Testleri İçe Aktar
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                JSON dosyalarını sürükleyip bırakın veya seçin
              </p>
            </div>
          </div>
          <IconButton
            icon={X}
            onClick={handleClose}
            variant="ghost"
            size="sm"
            tooltip="Kapat"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {importResults ? (
          /* Import Results */
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              backgroundColor: 'var(--status-success)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle size={24} color="white" />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 500, 
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem 0'
            }}>
              Import Tamamlandı
            </h3>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '0 0 1.5rem 0'
            }}>
              <p>✅ {importResults.success} workflow başarıyla import edildi</p>
              {importResults.skipped > 0 && <p>⚠️ {importResults.skipped} workflow atlandı (zaten mevcut)</p>}
              {importResults.failed > 0 && <p>❌ {importResults.failed} workflow import edilemedi</p>}
            </div>
            <Button 
              onClick={handleClose}
              variant="cosmic"
              size="md"
            >
              Tamam
            </Button>
          </div>
        ) : previews.length > 0 ? (
          /* Preview Section */
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: 500, 
              color: 'var(--text-primary)',
              margin: '0 0 1rem 0'
            }}>
              Import Önizleme ({previews.length} workflow)
            </h4>
            
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {previews.map((preview, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '0.75rem',
                    borderBottom: index < previews.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    backgroundColor: preview.isValid ? 'transparent' : 'rgba(220, 38, 38, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {preview.isValid ? (
                      <CheckCircle size={16} style={{ color: 'var(--status-success)' }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: 'var(--status-error)' }} />
                    )}
                    <span style={{ 
                      fontWeight: 500, 
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}>
                      {preview.name}
                    </span>
                    {preview.willOverwrite && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--status-warning)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        Üzerine yazılacak
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem'
                  }}>
                    {preview.description || 'Açıklama yok'}
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <span>📋 {preview.stepCount} adım</span>
                    <span>📁 {preview.suite}</span>
                    {preview.tags.length > 0 && (
                      <span>🏷️ {preview.tags.join(', ')}</span>
                    )}
                    {preview.browserType && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {(() => {
                          switch(preview.browserType) {
                            case 'chromium': return <Chrome size={12} style={{ color: '#4285F4' }} />;
                            case 'firefox': return <Globe size={12} style={{ color: '#FF7139' }} />;
                            case 'webkit': return <Globe size={12} style={{ color: '#007AFF' }} />;
                            case 'msedge': return <Globe size={12} style={{ color: '#0078D4' }} />;
                            default: return <Chrome size={12} style={{ color: '#4285F4' }} />;
                          }
                        })()} 
                        {(() => {
                          switch(preview.browserType) {
                            case 'chromium': return 'Chrome';
                            case 'firefox': return 'Firefox';
                            case 'webkit': return 'Safari';
                            case 'msedge': return 'Edge';
                            default: return 'Chrome';
                          }
                        })()} 
                      </span>
                    )}
                  </div>
                  
                  {!preview.isValid && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--status-error)'
                    }}>
                      {preview.errors.map((error, i) => (
                        <div key={i}>• {error}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <ButtonGroup spacing="md">
              <Button
                variant="secondary"
                size="md"
                onClick={handleClose}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={importing || previews.filter(p => p.isValid).length === 0}
                loading={importing}
                onClick={handleImport}
              >
                {importing ? 'Import Ediliyor...' : `${previews.filter(p => p.isValid).length} Workflow'u Import Et`}
              </Button>
            </ButtonGroup>
          </div>
        ) : (
          /* File Drop Zone */
          <div>
            <div
              style={{
                border: `2px dashed ${dragActive ? 'var(--color-selected)' : 'var(--border-primary)'}`,
                borderRadius: '0.75rem',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
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
                <Upload size={24} color="var(--text-secondary)" />
              </div>
              
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0'
              }}>
                Dosyaları buraya sürükleyip bırakın
              </h4>
              
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                margin: '0 0 1rem 0'
              }}>
                veya dosya seçmek için tıklayın
              </p>
              
              <Button 
                variant="cosmic"
                size="md"
                style={{ pointerEvents: 'none' }}
              >
                Dosya Seç
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Info size={16} style={{ color: 'var(--status-info)' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Desteklenen formatlar:</strong> Test Builder export dosyaları, çoklu workflow export dosyaları
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDialog; 