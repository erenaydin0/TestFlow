'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Save, Play, Download, Upload, Trash2 } from 'lucide-react';

import { Sidebar, Header } from '@/components/layout';
import LoadingErrorState from '@/components/common/LoadingErrorState';
import {
  UnifiedToolbar,
  TestStepCard,
  ActionsSidebar,
  StepConfigurationPanel
} from '@/components/test-builder';
import dynamic from 'next/dynamic';

// Lazy load modals (heavy components)
const TestModal = dynamic(() => import('@/components/modals/TestModal').then(mod => ({ default: mod.default })), {
  ssr: false
});
const ConfirmDialog = dynamic(() => import('@/components/modals/ConfirmDialog').then(mod => ({ default: mod.default })), {
  ssr: false
});

import { TestStep, BrowserType } from '@/types';
import { getTranslatedActionByType } from '@/utils/actions';
import { exportTestWorkflow, importTestWorkflow, validateWorkflow } from '@/utils/fileUtils';
import {
  useTestSteps,
  useUnsavedChanges,
  useNotifications
} from '@/hooks';
import { useSidebar, useBrowserSettings, useI18n } from '@/hooks';
import { TestService, ExecutionService } from '@/utils/api';

function TestBuilderContent() {
  const { isCollapsed } = useSidebar();
  const { t } = useI18n();
  const {
    testSteps,
    setTestSteps,
    canUndo,
    canRedo,
    saveToHistory,
    undo,
    redo,
    deleteStep,
    updateStepProperty,
    generateId,
    addStep
  } = useTestSteps();

  const { notifyTestSaved, notifyTestImported, notifyTestFailure, notifyTestStart, notifyWorkflowLoaded } = useNotifications();

  // Selection State
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [copiedSteps, setCopiedSteps] = useState<TestStep[]>([]);

  // Drag State
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'before' | 'after' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [loadedWorkflowId, setLoadedWorkflowId] = useState<string | null>(null);
  const [loadedWorkflowName, setLoadedWorkflowName] = useState<string | null>(null);
  const [loadedWorkflowData, setLoadedWorkflowData] = useState<any>(null);
  const [enableScreenshots, setEnableScreenshots] = useState(false);
  const [enableRecording, setEnableRecording] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Browser settings
  const { defaultBrowser, defaultHeadless, defaultRecording, defaultScreenshots } = useBrowserSettings();
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>(defaultBrowser);
  const [headlessMode, setHeadlessMode] = useState(defaultHeadless);

  const handleBrowserChange = useCallback((browser: string) => {
    setSelectedBrowser(browser as BrowserType);
  }, []);

  // Varsayılan ayarları uygula
  useEffect(() => {
    setEnableScreenshots(defaultScreenshots);
    setEnableRecording(defaultRecording);
    setHeadlessMode(defaultHeadless);
    setSelectedBrowser(defaultBrowser);
  }, [defaultScreenshots, defaultRecording, defaultHeadless, defaultBrowser]);

  // Promise resolver for save operation
  const savePromiseRef = useRef<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  // Unsaved changes hook
  const {
    hasUnsavedChanges,
    showUnsavedDialog,
    pendingNavigation,
    handleNavigation,
    confirmNavigation,
    cancelNavigation,
    saveAndNavigate,
    markAsSaved,
    resetUnsavedChanges
  } = useUnsavedChanges({
    testSteps,
    canUndo,
    onSave: async () => {
      if (testSteps.length === 0) return;

      return new Promise<void>((resolve, reject) => {
        savePromiseRef.current = { resolve, reject };
        setIsSaveDialogOpen(true);
      });
    }
  });

  const searchParams = useSearchParams();

  // Auto-add first "Navigate" step for new tests
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    // Only run once on initial mount
    if (hasInitializedRef.current) return;

    // Don't add if loading an existing workflow
    const loadWorkflowId = searchParams.get('load');
    if (loadWorkflowId) return;

    // Don't add if there are already steps
    if (testSteps.length > 0) return;

    // Add initial navigate step
    hasInitializedRef.current = true;
    const initialStep: TestStep = {
      id: generateId(),
      type: 'navigate',
      description: '',
      url: ''
    };

    const newSteps = [initialStep];
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    setSelectedStep(initialStep);
  }, []); // Empty deps - only run on mount

  // Handle drop on list
  const handleAddStep = (actionType: string) => {
    const newStep: TestStep = {
      id: generateId(),
      type: actionType,
      description: '',
      // Add default values based on action type if needed
    };

    const newSteps = [...testSteps, newStep];
    setTestSteps(newSteps);
    saveToHistory(newSteps);

    // Scroll to bottom or select the new step
    setSelectedStep(newStep);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // If no drop target, default to end of list
    const target = dropTarget || { index: testSteps.length, position: 'before' };

    // Calculate final insertion index
    let insertIndex = target.index;
    if (target.position === 'after') {
      insertIndex += 1;
    }

    if (draggedAction) {
      // Create new step
      const action = getTranslatedActionByType(draggedAction, t);
      if (action) {
        const newStep: TestStep = {
          id: generateId(),
          type: action.type as any
        };

        const newSteps = [...testSteps];
        newSteps.splice(insertIndex, 0, newStep);

        setTestSteps(newSteps);
        saveToHistory(newSteps);
      }
    } else if (draggedStep) {
      // Reorder existing step
      const draggedStepIndex = testSteps.findIndex(s => s.id === draggedStep);
      if (draggedStepIndex === -1) return;

      const newSteps = [...testSteps];
      const [removed] = newSteps.splice(draggedStepIndex, 1);

      // Adjust index if we removed an item before the insertion point
      let finalIndex = insertIndex;
      if (draggedStepIndex < insertIndex) {
        finalIndex -= 1;
      }

      newSteps.splice(finalIndex, 0, removed);

      setTestSteps(newSteps);
      saveToHistory(newSteps);
    }

    // Clear drag states
    setDraggedAction(null);
    setDraggedStep(null);
    setDropTarget(null);
  }, [draggedAction, draggedStep, testSteps, dropTarget, generateId, setTestSteps, saveToHistory]);

  const deleteSelectedSteps = useCallback(() => {
    if (selectedSteps.size === 0) return;
    setShowDeleteConfirm(true);
  }, [selectedSteps.size]);

  const confirmDeleteSteps = useCallback(() => {
    if (selectedSteps.size === 0) return;

    // Delete all selected steps
    const newSteps = testSteps.filter(step => !selectedSteps.has(step.id));
    setTestSteps(newSteps);
    saveToHistory(newSteps);

    // Clear selections
    setSelectedSteps(new Set());
    if (selectedStep && selectedSteps.has(selectedStep.id)) {
      setSelectedStep(null);
    }

    setShowDeleteConfirm(false);
  }, [selectedSteps, testSteps, saveToHistory, selectedStep]);

  const handleStepClick = useCallback((step: TestStep, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedSteps);
      if (newSelected.has(step.id)) {
        newSelected.delete(step.id);
      } else {
        newSelected.add(step.id);
      }
      setSelectedSteps(newSelected);

      // If only one item remains selected, set it as selectedStep
      if (newSelected.size === 1) {
        const id = Array.from(newSelected)[0];
        const s = testSteps.find(s => s.id === id);
        setSelectedStep(s || null);
      } else {
        setSelectedStep(null);
      }
    } else {
      setSelectedSteps(new Set([step.id]));
      setSelectedStep(step);
      setIsModalOpen(true);
    }
  }, [selectedSteps, testSteps]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStep(null);
  }, []);

  // Handle export workflow
  const handleExport = useCallback(() => {
    if (testSteps.length === 0) {
      notifyTestFailure(t('testBuilder.export'), '', t('testBuilder.noStepsToExport'));
      return;
    }

    try {
      const workflowName = `test-workflow-${new Date().toISOString().split('T')[0]}`;
      exportTestWorkflow(
        testSteps,
        workflowName,
        {
          description: '',
          tags: [],
          suite: 'Default',
          browserType: selectedBrowser,
          enableScreenshots,
          enableRecording,
          headlessMode
        }
      );
      notifyTestImported(`"${workflowName}" başarıyla export edildi!`, '');
    } catch (error) {
      console.error('Export error:', error);
      notifyTestFailure(t('testBuilder.export'), '', t('testBuilder.exportError'));
    }
  }, [testSteps, selectedBrowser, enableScreenshots, enableRecording, headlessMode]);

  // Handle import workflow
  const handleImport = useCallback(async (file: File) => {
    try {
      const { steps, name, metadata } = await importTestWorkflow(file);

      // Validate imported workflow
      const validation = validateWorkflow(steps);
      if (!validation.isValid) {
        notifyTestFailure(`${name} - Doğrulama Hatası`, '', validation.errors.join(', '));
        return;
      }

      // Generate new IDs to avoid conflicts
      const newSteps = steps.map(step => ({
        ...step,
        id: generateId()
      }));

      // Add imported steps to current workflow
      const updatedSteps = [...testSteps, ...newSteps];
      setTestSteps(updatedSteps);
      saveToHistory(updatedSteps);

      // Apply imported browser settings if available
      if (metadata?.browserType && metadata.browserType !== selectedBrowser) {
        setSelectedBrowser(metadata.browserType);
      }
      if (metadata?.enableScreenshots !== undefined && metadata.enableScreenshots !== enableScreenshots) {
        setEnableScreenshots(metadata.enableScreenshots);
      }
      if (metadata?.enableRecording !== undefined && metadata.enableRecording !== enableRecording) {
        setEnableRecording(metadata.enableRecording);
      }
      if (metadata?.headlessMode !== undefined && metadata.headlessMode !== headlessMode) {
        setHeadlessMode(metadata.headlessMode);
      }

      const metadataInfo = metadata?.browserType ? ` (${metadata.browserType})` : '';
      notifyTestImported(`${name} (${newSteps.length} adım)${metadataInfo}`, '');
    } catch (error) {
      console.error('Import error:', error);
      notifyTestFailure(t('testBuilder.import'), '', error instanceof Error ? error.message : t('common.unknownError'));
    }
  }, [testSteps, setTestSteps, saveToHistory, generateId]);

  // Handle save workflow
  const handleSave = useCallback(() => {
    if (testSteps.length === 0) {
      notifyTestFailure(t('testBuilder.save'), '', t('testBuilder.noStepsToSave'));
      return;
    }

    setIsSaveDialogOpen(true);
  }, [testSteps]);

  // Handle save from dialog
  const handleSaveFromDialog = useCallback(async (data: {
    name: string;
    description: string;
    tags: string[];
    suite: string;
    browserType: BrowserType;
  }) => {
    try {
      const testData = {
        name: data.name,
        description: data.description,
        workflow: testSteps,
        tags: data.tags,
        suite: data.suite,
        enableScreenshots,
        enableRecording,
        headlessMode,
        browserType: data.browserType,
        isExecutable: true,
        status: 'pending' as const,
        duration: 0
      };

      let workflowId: string;

      // Backend'e kaydet
      if (loadedWorkflowId) {
        // Güncelleme
        const updated = await TestService.updateTest(loadedWorkflowId, testData);
        workflowId = updated.id;

        // Update loadedWorkflowData with new data
        setLoadedWorkflowData(updated);

        notifyTestSaved(`${data.name} (güncellendi)`, workflowId);
      } else {
        // Yeni kayıt
        const saved = await TestService.createTest(testData);
        workflowId = saved.id;
        setLoadedWorkflowId(workflowId);

        // Set loadedWorkflowData for new workflow
        setLoadedWorkflowData(saved);

        notifyTestSaved(data.name, workflowId);
      }

      setIsSaveDialogOpen(false);

      // Mark as saved for unsaved changes tracking
      markAsSaved();

      // Resolve the save promise if exists
      if (savePromiseRef.current) {
        savePromiseRef.current.resolve();
        savePromiseRef.current = null;
      }
    } catch (error) {
      notifyTestFailure('Test Kaydetme', '', error instanceof Error ? error.message : 'Bilinmeyen hata');

      // Reject the save promise if exists
      if (savePromiseRef.current) {
        savePromiseRef.current.reject(error);
        savePromiseRef.current = null;
      }
    }
  }, [testSteps, loadedWorkflowId, enableScreenshots, enableRecording, headlessMode, markAsSaved]);

  // Handle run workflow
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(async () => {
    if (testSteps.length === 0) {
      notifyTestFailure(loadedWorkflowName || (loadedWorkflowId ? `Test ${loadedWorkflowId.slice(0, 8)}` : 'Test Builder'), '', 'Çalıştırılacak test adımı bulunamadı.');
      return;
    }

    // Get actual test name if workflow is loaded
    const actualWorkflowName = loadedWorkflowName ||
      (loadedWorkflowId ? `Test ${loadedWorkflowId.slice(0, 8)}` : 'Test Builder Workflow');

    setIsRunning(true);

    try {

      // Convert frontend steps to backend format
      const backendSteps = testSteps.map(step => ({
        id: step.id,
        type: step.type,
        config: {
          url: step.url,
          selector: step.selector,
          value: step.value,
          text: step.value, // For type actions
          target: step.selector, // Alternative selector name
          duration: step.duration,
          verificationType: step.verificationType, // For verify actions
          expectedValue: step.expectedValue,
          filename: step.filename,
          optionType: step.optionType, // For dropdown actions
          optionValue: step.optionValue, // For dropdown actions
        }
      }));
      const data = await ExecutionService.executeWorkflow({
        workflowId: loadedWorkflowId || 'test-builder',
        workflowName: actualWorkflowName,
        steps: backendSteps,
        suite: loadedWorkflowName ? 'Saved Tests' : 'Test Builder',
        tags: loadedWorkflowName ? ['saved', 'edited'] : ['manual', 'builder'],
        options: {
          enableScreenshots,
          enableRecording,
          headlessMode,
          browserType: selectedBrowser
        }
      });

      notifyTestStart(actualWorkflowName, data.executionId);

    } catch (error) {
      console.error('Test execution error:', error);
      notifyTestFailure(actualWorkflowName, 'failed', error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsRunning(false);
    }
  }, [testSteps, enableScreenshots, enableRecording, headlessMode, selectedBrowser, loadedWorkflowId, loadedWorkflowName]);

  // Load workflow from URL parameter
  const shownNotifications = useRef(new Set<string>());

  useEffect(() => {
    const loadWorkflowId = searchParams.get('load');

    if (loadWorkflowId && loadWorkflowId !== loadedWorkflowId) {
      // Backend'den workflow yükle
      TestService.fetchTestById(loadWorkflowId)
        .then(workflow => {
          if (workflow && workflow.workflow) {
            setTestSteps(workflow.workflow);
            setLoadedWorkflowId(loadWorkflowId);
            setLoadedWorkflowName(workflow.name);
            setLoadedWorkflowData(workflow); // Store full workflow data

            // Load screenshot and recording settings
            setEnableScreenshots(workflow.enableScreenshots || false);
            setEnableRecording(workflow.enableRecording || false);
            setHeadlessMode(workflow.headlessMode || false);

            // Load browser settings
            if (workflow.browserType) {
              setSelectedBrowser(workflow.browserType);
            }

            // Reset unsaved changes after workflow is loaded
            setTimeout(() => {
              resetUnsavedChanges();
            }, 0);

            // Show success message only if not shown before for this workflow
            const notificationKey = `loaded-${loadWorkflowId}`;
            if (!shownNotifications.current.has(notificationKey)) {
              shownNotifications.current.add(notificationKey);
              setTimeout(() => {
                notifyWorkflowLoaded(workflow.name);
              }, 100);
            }
          } else {
            notifyTestFailure(t('navigation.testBuilder'), '', t('testBuilder.workflowNotFoundOrInvalid'));
          }
        })
        .catch(error => {
          console.error(t('testBuilder.workflowLoadError'), error);
          notifyTestFailure(t('navigation.testBuilder'), '', t('testBuilder.workflowLoadFailed'));
        });
    }

    // Clear notification tracking when no workflow is loaded
    if (!loadWorkflowId) {
      shownNotifications.current.clear();
      setLoadedWorkflowName(null);
    }
  }, [searchParams, loadedWorkflowId]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
      {/* Cosmic Background Animations */}
      <div className="cosmic-background">
        {/* Floating particles */}
        <div className="cosmic-particle" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
        <div className="cosmic-particle" style={{ left: '80%', top: '40%', animationDelay: '2s' }} />
        <div className="cosmic-particle" style={{ left: '30%', top: '60%', animationDelay: '4s' }} />
        <div className="cosmic-particle" style={{ left: '70%', top: '80%', animationDelay: '6s' }} />
        <div className="cosmic-particle" style={{ left: '50%', top: '30%', animationDelay: '3s' }} />
        <div className="cosmic-particle" style={{ left: '20%', top: '70%', animationDelay: '5s' }} />

        {/* Nebula clouds */}
        <div className="nebula-cloud nebula-cloud-1" />
        <div className="nebula-cloud nebula-cloud-2" />
        <div className="nebula-cloud nebula-cloud-3" />
      </div>

      <Sidebar onNavigationAttempt={handleNavigation} />

      <div style={{
        flex: 1,
        marginLeft: isCollapsed ? '4rem' : '16rem',
        paddingTop: '4rem',
        transition: 'margin-left 0.3s ease',
        position: 'relative',
        zIndex: 1
      }}>
        <Header />

        <div style={{
          height: 'calc(100vh - 4rem)',
          backgroundColor: 'transparent',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 3-Column Layout */}
          <div className="flex-1 flex overflow-hidden p-4 gap-4">
            {/* Left Sidebar - Actions */}
            <div className="test-builder-panel w-64 flex-shrink-0 rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-sm">
              <ActionsSidebar onAddStep={handleAddStep} />
            </div>

            {/* Center - Timeline & Toolbar */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Toolbar - Centered and above timeline */}
              <div className="flex justify-center mb-4">
                <div className="max-w-3xl w-full">
                  <UnifiedToolbar
                    testStepsCount={testSteps.length}
                    onUndo={() => undo(() => {
                      setSelectedSteps(new Set());
                      setSelectedStep(null);
                    })}
                    onRedo={() => redo(() => {
                      setSelectedSteps(new Set());
                      setSelectedStep(null);
                    })}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onCopy={() => {
                      const selected = testSteps.filter(s => selectedSteps.has(s.id));
                      setCopiedSteps(selected);
                    }}
                    onPaste={() => {
                      if (copiedSteps.length === 0) return;
                      const newSteps = copiedSteps.map(s => ({ ...s, id: generateId() }));
                      const updatedSteps = [...testSteps, ...newSteps];
                      setTestSteps(updatedSteps);
                      saveToHistory(updatedSteps);
                    }}
                    onDuplicate={() => {
                      const selected = testSteps.filter(s => selectedSteps.has(s.id));
                      if (selected.length === 0) return;
                      const newSteps = selected.map(s => ({ ...s, id: generateId() }));
                      const updatedSteps = [...testSteps, ...newSteps];
                      setTestSteps(updatedSteps);
                      saveToHistory(updatedSteps);
                    }}
                    selectedStepsCount={selectedSteps.size}
                    copiedStepsCount={copiedSteps.length}
                    onExport={handleExport}
                    onImport={handleImport}
                    onSave={handleSave}
                    onRun={handleRun}
                    isRunning={isRunning}
                    enableScreenshots={enableScreenshots}
                    enableRecording={enableRecording}
                    headlessMode={headlessMode}
                    onToggleScreenshots={() => {
                      setEnableScreenshots(!enableScreenshots);
                    }}
                    onToggleRecording={() => {
                      setEnableRecording(!enableRecording);
                    }}
                    onToggleHeadless={() => {
                      setHeadlessMode(!headlessMode);
                    }}
                    selectedBrowser={selectedBrowser}
                    onBrowserChange={handleBrowserChange}
                  />
                </div>
              </div>

              {/* Timeline List */}
              <div
                className="test-builder-panel flex-1 overflow-y-auto rounded-xl border border-[var(--border-primary)] shadow-sm p-6"
                onClick={() => setSelectedStep(null)} // Deselect when clicking empty space
              >
                <div className="max-w-3xl mx-auto pb-20">
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--border-primary)] -z-10 transform -translate-x-1/2"></div>

                    <div className="space-y-0 relative">
                      {testSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className="relative pl-16 group transition-all duration-200 ease-in-out"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Calculate if we are in the top or bottom half
                            const rect = e.currentTarget.getBoundingClientRect();
                            const midY = rect.top + rect.height / 2;
                            const position = e.clientY < midY ? 'before' : 'after';

                            // Only update if changed to avoid unnecessary renders
                            if (!dropTarget || dropTarget.index !== index || dropTarget.position !== position) {
                              setDropTarget({ index, position });
                            }

                            setIsDragOver(true);
                          }}
                          onDragLeave={(e) => {
                            // Only clear if we're actually leaving the container, not just entering a child
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              // Don't clear immediately to prevent flickering when moving between items
                            }
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleDrop(e);
                          }}
                        >
                          {/* Drop Indicator Line */}
                          {dropTarget && dropTarget.index === index && dropTarget.position === 'before' && (
                            <div className="absolute top-0 left-16 right-0 h-0.5 bg-[var(--accent-primary)] z-20 shadow-[0_0_8px_rgba(59,130,246,0.6)] rounded-full transform -translate-y-1/2 pointer-events-none transition-all duration-200" />
                          )}

                          {/* Step Number/Dot */}
                          <div className={`absolute left-8 top-8 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${selectedSteps.has(step.id)
                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white scale-110 shadow-md'
                            : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                            }`}>
                            {index + 1}
                          </div>

                          <div className="mb-4 transition-transform duration-200">
                            <TestStepCard
                              step={step}
                              isSelected={selectedSteps.has(step.id)}
                              isMultiSelected={selectedSteps.has(step.id) && selectedSteps.size > 1}
                              draggedStep={draggedStep}
                              onStepDragStart={setDraggedStep}
                              onDragEnd={() => {
                                setDraggedAction(null);
                                setDraggedStep(null);
                                setIsDragOver(false);
                                setDropTarget(null);
                              }}
                              onStepClick={(step: TestStep, isMulti: boolean) => handleStepClick(step, isMulti)}
                              onDeleteStep={(id: string) => {
                                const newSteps = testSteps.filter(s => s.id !== id);
                                setTestSteps(newSteps);
                                saveToHistory(newSteps);
                              }}
                              setSelectedSteps={setSelectedSteps}
                              setSelectedStep={setSelectedStep}
                              selectedSteps={selectedSteps}
                              selectedStep={selectedStep}
                              testSteps={testSteps}
                              setTestSteps={setTestSteps}
                              saveToHistory={saveToHistory}
                            />
                          </div>

                          {/* Drop Indicator Line (After) */}
                          {dropTarget && dropTarget.index === index && dropTarget.position === 'after' && (
                            <div className="absolute bottom-4 left-16 right-0 h-0.5 bg-[var(--accent-primary)] z-20 shadow-[0_0_8px_rgba(59,130,246,0.6)] rounded-full transform translate-y-1/2 pointer-events-none transition-all duration-200" />
                          )}
                        </div>
                      ))}

                      {/* Drop zone at the end */}
                      <div
                        className={`relative pl-16 mt-4 transition-all duration-200 ${dropTarget && dropTarget.index === testSteps.length ? 'scale-[1.02]' : ''
                          }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!dropTarget || dropTarget.index !== testSteps.length) {
                            setDropTarget({ index: testSteps.length, position: 'before' }); // 'before' the end zone means at the end of list
                          }
                        }}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e);
                        }}
                      >
                        {/* Indicator for end zone */}
                        {dropTarget && dropTarget.index === testSteps.length && (
                          <div className="absolute top-0 left-16 right-0 h-0.5 bg-[var(--accent-primary)] z-20 shadow-[0_0_8px_rgba(59,130,246,0.6)] rounded-full transform -translate-y-1/2 pointer-events-none" />
                        )}

                        <div className="absolute left-8 top-1/2 w-3 h-3 rounded-full bg-[var(--border-primary)] transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 group-hover:bg-[var(--accent-primary)]"></div>
                        <div className={`h-12 border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition-all duration-200 ${dropTarget && dropTarget.index === testSteps.length
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                          : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                          }`}>
                          {t('testBuilder.dropHere')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Configuration */}
            <div className="test-builder-panel w-80 flex-shrink-0 rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-xl z-20">
              <StepConfigurationPanel
                step={selectedStep}
                onSave={(updatedStep) => {
                  const newSteps = testSteps.map(s =>
                    s.id === updatedStep.id ? updatedStep : s
                  );
                  setTestSteps(newSteps);
                  saveToHistory(newSteps);
                }}
                onClose={() => setSelectedStep(null)}
                onDelete={(id) => {
                  const newSteps = testSteps.filter(s => s.id !== id);
                  setTestSteps(newSteps);
                  saveToHistory(newSteps);
                  setSelectedStep(null);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TestModal
        isOpen={isSaveDialogOpen}
        onClose={() => {
          setIsSaveDialogOpen(false);
          if (savePromiseRef.current) {
            // Don't reject, just resolve empty to allow navigation if needed
            savePromiseRef.current.resolve();
            savePromiseRef.current = null;
          }
        }}
        onSave={handleSaveFromDialog}
        initialData={loadedWorkflowData ? {
          name: loadedWorkflowData.name,
          description: loadedWorkflowData.description,
          tags: loadedWorkflowData.tags || [],
          suite: loadedWorkflowData.suite || 'Default',
          browserType: selectedBrowser
        } : undefined}
        mode={loadedWorkflowId ? 'save' : 'create'}
        title={loadedWorkflowId ? t('testBuilder.updateTest') : t('testBuilder.saveTest')}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteSteps}
        title={t('testBuilder.deleteSteps')}
        message={t('testBuilder.deleteStepsConfirm', { count: selectedSteps.size })}
        confirmText={t('common.delete')}
        type="danger"
      />

      <ConfirmDialog
        isOpen={showUnsavedDialog}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        title={t('common.unsavedChanges')}
        message={t('common.unsavedChangesMessage')}
        confirmText={t('common.leave')}
        cancelText={t('common.cancel')}
        type="warning"
      />
    </div>
  );
}

export default function TestBuilder() {
  return (
    <Suspense fallback={<LoadingErrorState loading={true} error={null} loadingMessage="Yükleniyor..."><div></div></LoadingErrorState>}>
      <TestBuilderContent />
    </Suspense>
  );
}