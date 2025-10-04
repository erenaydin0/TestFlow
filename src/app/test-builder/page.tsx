'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { Sidebar, Header } from '@/components/layout';
import { 
  FloatingToolbar,
  ActionsPanel,
  CanvasControls,
  StepModal,
  ConnectionRenderer,
  TestStepCard,
  DragPreview,
  SnapLines,
  SelectionBox,
  UnsavedChangesDialog
} from '@/components/features/test-builder';
import { TestModal } from '@/components/modals';

import { TestStep, BrowserType } from '@/types';
import { getActionByType } from '@/lib/actions';
import { exportTestWorkflow, importTestWorkflow, validateWorkflow, saveWorkflowToStorage, getWorkflowById } from '@/lib/utils';
import { 
  useTestSteps,
  useCopyPaste,
  useSnapToGrid,
  useCanvasInteraction,
  useConnections,
  useSelection,
  useKeyboardShortcuts,
  useCanvasStyles,
  useMouseEvents,
  useUnsavedChanges,
  useTestNotifications
} from '@/hooks';
import { useSidebar, useBrowserSettings } from '@/contexts';

export default function TestBuilder() {
  const { isCollapsed } = useSidebar();
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
    autoArrangeSteps,
    generateId
  } = useTestSteps();
  
  const { notifyTestSaved, notifyTestImported, notifyTestFailure, notifyTestStart, notifyWorkflowLoaded } = useTestNotifications();

  const {
    selectedSteps,
    setSelectedSteps,
    selectedStep,
    setSelectedStep,
    copiedSteps,
    selectAllSteps,
    clearSelection,
    copySteps,
    pasteSteps,
    duplicateSteps
  } = useCopyPaste();

  const {
    snapEnabled,
    snapLines,
    setSnapLines,
    snapToPosition,
    clearSnapLines,
    toggleSnap
  } = useSnapToGrid();

  const {
    canvasRef,
    canvasOffset,
    setCanvasOffset,
    zoom,
    pan,
    setPan,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    draggedAction,
    setDraggedAction,
    draggedStep,
    setDraggedStep,
    setIsDragOver,
    dragPreview,
    setDragPreview,
    zoomIn,
    zoomOut,
    resetView,
    handleActionDragStart,
    handleStepDragStart,
    handleDragEnd,
    handleCanvasDragOver,
    handleCanvasDragEnter,
    handleCanvasDragLeave
  } = useCanvasInteraction();

  const {
    isConnecting,
    setIsConnecting,
    connectionStart,
    setConnectionStart,
    connectionType,
    setConnectionType,
    startConnection,
    endConnection,
    removeConnection,
    getStepCenter,
    getConnectionStyle
  } = useConnections();

  const {
    isSelecting: selectionIsSelecting,
    selectionBox: selectionSelectionBox,
    handleCanvasMouseDown: selectionHandleCanvasMouseDown,
    handleCanvasMouseMove: selectionHandleCanvasMouseMove,
    handleCanvasMouseUp: selectionHandleCanvasMouseUp,
    handleStepClick: selectionHandleStepClick
  } = useSelection();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [loadedWorkflowId, setLoadedWorkflowId] = useState<string | null>(null);
  const [loadedWorkflowName, setLoadedWorkflowName] = useState<string | null>(null);
  const [enableScreenshots, setEnableScreenshots] = useState(false);
  const [enableRecording, setEnableRecording] = useState(false);
  
  // Browser settings
  const { defaultBrowser, defaultHeadless, defaultRecording, defaultScreenshots } = useBrowserSettings();
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>(defaultBrowser);
  
  const handleBrowserChange = (browser: BrowserType) => {
    setSelectedBrowser(browser);
  };
  
  // Context'teki defaultBrowser değiştiğinde selectedBrowser'ı güncelle (sadece ilk yükleme için)
  useEffect(() => {
    setSelectedBrowser(defaultBrowser);
  }, []); // defaultBrowser dependency'si kaldırıldı - sadece mount'ta çalışsın

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
    onSave: async () => {
      if (testSteps.length === 0) return;
      
      return new Promise<void>((resolve, reject) => {
        savePromiseRef.current = { resolve, reject };
        setIsSaveDialogOpen(true);
      });
    }
  });
  const [headlessMode, setHeadlessMode] = useState(defaultHeadless);
  
  // Varsayılan ayarları uygula
  useEffect(() => {
    setEnableScreenshots(defaultScreenshots);
    setEnableRecording(defaultRecording);
    setHeadlessMode(defaultHeadless);
    setSelectedBrowser(defaultBrowser);
  }, [defaultScreenshots, defaultRecording, defaultHeadless, defaultBrowser]);
  
  // When save dialog opens, hide unsaved changes dialog
  useEffect(() => {
    if (isSaveDialogOpen && showUnsavedDialog) {
      // SaveDialog açıldığında UnsavedChangesDialog'u gizle
      // Ancak bu geçici bir gizleme, gerçek kapatma handleSaveFromDialog'da olacak
    }
  }, [isSaveDialogOpen, showUnsavedDialog]);
  
  // Debug: Log initial state
  useEffect(() => {
  }, [enableScreenshots, enableRecording, headlessMode]);
  const searchParams = useSearchParams();

  // Canvas styles
  const canvasStyles = useCanvasStyles({
    zoom,
    pan,
    canvasOffset,
    isPanning
  });

  // Custom mouse move handler that handles both selection and panning
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isPanning) {
      // Handle panning
      const deltaX = clientX - panStart.x;
      const deltaY = clientY - panStart.y;
      
      // Update canvas offset
      setCanvasOffset({ 
        x: canvasOffset.x + deltaX, 
        y: canvasOffset.y + deltaY 
      });
      
      // Update pan start for next move
      setPanStart({ x: clientX, y: clientY });
    } else {
      // Delegate to selection handler for selection box
      selectionHandleCanvasMouseMove(
        e,
        canvasRef,
        zoom,
        canvasOffset,
        isPanning,
        panStart,
        setPan,
        setCanvasOffset,
        testSteps,
        setSelectedSteps
      );
    }
  }, [isPanning, panStart, canvasOffset, zoom, testSteps, selectionHandleCanvasMouseMove]);

  // Mouse events
  useMouseEvents({
    selectionIsSelecting,
    isPanning,
    canvasRef,
    zoom,
    canvasOffset,
    panStart,
    testSteps,
    selectionHandleCanvasMouseMove: handleMouseMove,
    selectionHandleCanvasMouseUp,
    setPan,
    setCanvasOffset,
    setSelectedSteps,
    setIsPanning
  });

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Calculate position considering canvas offset and zoom
    const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;

    // Center the step first
    const centeredX = rawX - 96; // Center the step (12rem = 192px, so 96px offset)
    const centeredY = rawY - 40;  // Center vertically

    if (draggedAction) {
      // Create new step with snap
      const action = getActionByType(draggedAction);
      if (action) {
        const snapped = snapToPosition(centeredX, centeredY, testSteps);
        const newStep: TestStep = {
          id: generateId(),
          type: action.type as any,
          x: snapped.x,
          y: snapped.y
        };
        const newSteps = [...testSteps, newStep];
        setTestSteps(newSteps);
        saveToHistory(newSteps);
      }
    } else if (draggedStep) {
      // Move existing step with snap
      const snapped = snapToPosition(centeredX, centeredY, testSteps, draggedStep);
      const newSteps = testSteps.map(step => 
        step.id === draggedStep 
          ? { 
              ...step, 
              x: snapped.x,
              y: snapped.y
            }
          : step
      );
      setTestSteps(newSteps);
      saveToHistory(newSteps);
    }
    
    // Always clear drag states after drop
    setDraggedAction(null);
    setDraggedStep(null);
    setIsDragOver(false);
    setDragPreview(null);
    clearSnapLines(); // Clear snap lines
  }, [draggedAction, draggedStep, canvasOffset, zoom, snapToPosition]);

  const deleteSelectedSteps = () => {
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
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isModalOpen,
    selectedSteps,
    copiedSteps,
    testSteps,
    generateId,
    copySteps,
    pasteSteps,
    duplicateSteps,
    selectAllSteps,
    deleteSelectedSteps,
    clearSelection,
    undo,
    redo,
    setTestSteps,
    saveToHistory,
    setSelectedSteps,
    setSelectedStep
  });

  // Canvas mouse event handlers using selection hook
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    selectionHandleCanvasMouseDown(
      e,
      canvasRef,
      zoom,
      canvasOffset,
      isPanning,
      setIsPanning,
      setPanStart,
      testSteps,
      selectedSteps,
      setSelectedSteps,
      setSelectedStep
    );
  };

  const handleStepClick = (step: TestStep, ctrlKey: boolean = false) => {
    selectionHandleStepClick(step, ctrlKey, selectedSteps, setSelectedSteps, setSelectedStep);
    
    // Open modal only for single selection
    if (!ctrlKey) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStep(null);
  };

  // Handle export workflow
  const handleExport = useCallback(() => {
    if (testSteps.length === 0) {
      notifyTestFailure('Test Dışa Aktarma', '', 'Dışa aktarılacak test adımı bulunamadı.');
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
      notifyTestFailure('Test Dışa Aktarma', '', 'Workflow dışa aktarılırken bir hata oluştu.');
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
        id: generateId(),
        // Offset position to avoid overlap
        x: step.x + 50,
        y: step.y + 50
      }));

      // Update connections with new IDs
      const idMapping: { [oldId: string]: string } = {};
      steps.forEach((step, index) => {
        idMapping[step.id] = newSteps[index].id;
      });

      newSteps.forEach(step => {
        if (step.connections) {
          step.connections = step.connections.map(id => idMapping[id]).filter(Boolean);
        }
        if (step.trueConnection && idMapping[step.trueConnection]) {
          step.trueConnection = idMapping[step.trueConnection];
        }
        if (step.falseConnection && idMapping[step.falseConnection]) {
          step.falseConnection = idMapping[step.falseConnection];
        }
      });

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
      notifyTestFailure('Workflow İçe Aktarma', '', error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  }, [testSteps, setTestSteps, saveToHistory, generateId]);

  // Handle save workflow - Updated to show save dialog
  const handleSave = useCallback(() => {
    if (testSteps.length === 0) {
      notifyTestFailure('Test Kaydetme', '', 'Kaydedilecek test adımı bulunamadı.');
      return;
    }
    
    setIsSaveDialogOpen(true);
  }, [testSteps]);

  // Handle save from dialog
  const handleSaveFromDialog = useCallback((data: {
    name: string;
    description: string;
    tags: string[];
    suite: string;
    browserType: BrowserType;
  }) => {
    try {
      const workflowId = saveWorkflowToStorage({
        name: data.name,
        description: data.description,
        steps: testSteps,
        tags: data.tags,
        suite: data.suite,
        id: loadedWorkflowId || undefined, // Düzenleme modunda mevcut ID'yi kullan
        enableScreenshots,
        enableRecording,
        headlessMode,
        browserType: data.browserType
      });
      
      setIsSaveDialogOpen(false);
      
      if (loadedWorkflowId) {
        notifyTestSaved(`${data.name} (güncellendi)`, workflowId);
      } else {
        notifyTestSaved(data.name, workflowId);
        setLoadedWorkflowId(workflowId); // Yeni kaydedilen workflow'u track et
      }
      
      // Mark as saved for unsaved changes tracking
      markAsSaved();
      
      // Resolve the save promise if exists
      if (savePromiseRef.current) {
        savePromiseRef.current.resolve();
        savePromiseRef.current = null;
      }
      
      // Optional: Clear current workspace or keep it
      // setTestSteps([]);
      // clearSelection();
    } catch (error) {
      notifyTestFailure('Test Kaydetme', '', error instanceof Error ? error.message : 'Bilinmeyen hata');
      
      // Reject the save promise if exists
      if (savePromiseRef.current) {
        savePromiseRef.current.reject(error);
        savePromiseRef.current = null;
      }
    }
  }, [testSteps, loadedWorkflowId, enableScreenshots, enableRecording, headlessMode, markAsSaved]);

  // Handle run workflow - Updated to use backend API
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRun = useCallback(async () => {
    if (testSteps.length === 0) {
      notifyTestFailure(loadedWorkflowName || (loadedWorkflowId ? `Test ${loadedWorkflowId.slice(0, 8)}` : 'Test Builder'), '', 'Çalıştırılacak test adımı bulunamadı.');
      return;
    }

    // Get actual test name if workflow is loaded
    const actualWorkflowName = loadedWorkflowName || 
      (loadedWorkflowId ? (getWorkflowById(loadedWorkflowId)?.name || `Test ${loadedWorkflowId.slice(0, 8)}`) : 'Test Builder Workflow');
    
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
          condition: step.condition,
          expectedValue: step.expectedValue,
          verificationType: step.verificationType, // For verify actions
          direction: step.direction,
          amount: step.amount,
          filename: step.filename,
          key: step.key,
          optionType: step.optionType, // For dropdown actions
          optionValue: step.optionValue // For dropdown actions
        }
      }));
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        })
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      notifyTestStart(actualWorkflowName, data.executionId);
      
      // Optional: Navigate to tests page to see results
      // router.push('/tests');
      
    } catch (error) {
      console.error('Test execution error:', error);
      notifyTestFailure(actualWorkflowName, 'failed', error instanceof Error ? error.message : 'Bilinmeyen hata');
    } finally {
      setIsRunning(false);
    }
  }, [testSteps, enableScreenshots, enableRecording, headlessMode, selectedBrowser, loadedWorkflowId, loadedWorkflowName]);

  // Load workflow from URL parameter - Use ref to track shown notifications
  const shownNotifications = useRef(new Set<string>());
  
  useEffect(() => {
    const loadWorkflowId = searchParams.get('load');
    console.log('useEffect çalıştı:', { loadWorkflowId, loadedWorkflowId });
    
    if (loadWorkflowId && loadWorkflowId !== loadedWorkflowId) {
      const workflow = getWorkflowById(loadWorkflowId);
      if (workflow && workflow.workflow) {
        console.log('Workflow yükleniyor:', workflow.name);
        setTestSteps(workflow.workflow);
        setLoadedWorkflowId(loadWorkflowId);
        setLoadedWorkflowName(workflow.name);
        
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
          console.log('Bildirim gösteriliyor:', workflow.name);
          shownNotifications.current.add(notificationKey);
          setTimeout(() => {
            notifyWorkflowLoaded(workflow.name);
          }, 100);
        } else {
          console.log('Bildirim zaten gösterildi, tekrar gösterilmiyor');
        }
      } else {
        notifyTestFailure('Test Builder Workflow', '', 'Workflow bulunamadı veya geçersiz!');
      }
    }
    
    // Clear notification tracking when no workflow is loaded
    if (!loadWorkflowId) {
      shownNotifications.current.clear();
      setLoadedWorkflowName(null);
    }
  }, [searchParams, loadedWorkflowId]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar onNavigationAttempt={handleNavigation} />
      
      <div style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '4rem' : '16rem', 
        paddingTop: '4rem',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header />
        
        <div style={{ 
          height: 'calc(100vh - 4rem)',
          backgroundColor: 'var(--bg-secondary)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Canvas Controls */}
          <CanvasControls
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetView={resetView}
            testStepsCount={testSteps.length}
          />

          {/* Floating Toolbar */}
          <FloatingToolbar
            onAutoArrange={autoArrangeSteps}
            testStepsCount={testSteps.length}
            snapEnabled={snapEnabled}
            onToggleSnap={toggleSnap}
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
            onCopy={() => copySteps(testSteps)}
            onPaste={() => pasteSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            })}
            onDuplicate={() => duplicateSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            })}
            onDeleteSelected={deleteSelectedSteps}
            selectedStepsCount={selectedSteps.size}
            copiedStepsCount={copiedSteps.length}
            isConnecting={isConnecting}
            connectionType={connectionType}
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

          {/* Floating Actions Panel */}
          <ActionsPanel
            draggedAction={draggedAction}
            onActionDragStart={handleActionDragStart}
            onDragEnd={handleDragEnd}
            onMouseDown={(e) => {
              // Prevent canvas panning when dragging actions
              e.stopPropagation();
            }}
          />

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="canvas-background"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => handleCanvasDragOver(e, snapToPosition, testSteps, setSnapLines)}
            onDragEnter={(e) => handleCanvasDragEnter(e, snapToPosition, testSteps, setSnapLines)}
            onDragLeave={(e) => handleCanvasDragLeave(e, clearSnapLines)}
            onDragEnd={handleDragEnd}
            onMouseDown={handleCanvasMouseDown}
            style={canvasStyles.canvasContainer}
          >
            <div style={canvasStyles.innerContainer}>
              {/* SVG Layer for connections and snap lines */}
              <svg style={canvasStyles.svgLayer}>
                <ConnectionRenderer
                  testSteps={testSteps}
                  getStepCenter={getStepCenter}
                  getConnectionStyle={getConnectionStyle}
                  removeConnection={removeConnection}
                  setTestSteps={setTestSteps}
                  saveToHistory={saveToHistory}
                />
                
                {/* Snap lines */}
                <SnapLines
                  snapEnabled={snapEnabled}
                  snapLines={snapLines}
                />
                
                {/* Selection box */}
                <SelectionBox selectionBox={selectionSelectionBox} />
              </svg>
              {/* Render drag preview */}
              {dragPreview && (
                <DragPreview
                  dragPreview={dragPreview}
                  draggedStep={draggedStep}
                  testSteps={testSteps}
                />
              )}

              {/* Render test steps */}
              {testSteps.map((step) => {
                const isSelected = selectedStep === step;
                const isMultiSelected = selectedSteps.has(step.id);
                
                return (
                  <TestStepCard
                    key={step.id}
                    step={step}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    draggedStep={draggedStep}
                    selectedStep={selectedStep}
                    selectedSteps={selectedSteps}
                    isConnecting={isConnecting}
                    connectionStart={connectionStart}
                    connectionType={connectionType}
                    onStepDragStart={handleStepDragStart}
                    onDragEnd={handleDragEnd}
                    onStepClick={handleStepClick}
                    onDeleteStep={deleteStep}
                    onStartConnection={startConnection}
                    onEndConnection={endConnection}
                    setIsConnecting={setIsConnecting}
                    setConnectionStart={setConnectionStart}
                    setConnectionType={setConnectionType}
                    setSelectedSteps={setSelectedSteps}
                    setSelectedStep={setSelectedStep}
                    testSteps={testSteps}
                    setTestSteps={setTestSteps}
                    saveToHistory={saveToHistory}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StepModal
        isOpen={isModalOpen}
        step={selectedStep}
        onClose={closeModal}
        onUpdateProperty={updateStepProperty}
      />

      <TestModal
        isOpen={isSaveDialogOpen}
        onClose={() => {
          setIsSaveDialogOpen(false);
          // Reject save promise if canceled
          if (savePromiseRef.current) {
            savePromiseRef.current.reject(new Error('Save canceled by user'));
            savePromiseRef.current = null;
          }
        }}
        onSave={handleSaveFromDialog}
        initialData={loadedWorkflowId ? (() => {
          const workflow = getWorkflowById(loadedWorkflowId);
          return workflow ? {
            name: workflow.name,
            description: workflow.description,
            tags: workflow.tags,
            suite: workflow.suite,
            browserType: workflow.browserType
          } : undefined;
        })() : undefined}
        isUpdating={!!loadedWorkflowId}
        mode={loadedWorkflowId ? 'edit' : 'save'}
      />

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={saveAndNavigate}
        onDiscard={confirmNavigation}
        onCancel={cancelNavigation}
        isSaveDialogOpen={isSaveDialogOpen}
      />
    </div>
  );
}