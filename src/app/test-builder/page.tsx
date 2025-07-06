'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';

import { TestStep } from '@/types';
import FloatingToolbar from '@/components/test-builder/FloatingToolbar';
import ActionsPanel from '@/components/test-builder/ActionsPanel';
import CanvasControls from '@/components/test-builder/CanvasControls';
import StepModal from '@/components/test-builder/StepModal';
import ConnectionRenderer from '@/components/test-builder/ConnectionRenderer';
import TestStepCard from '@/components/test-builder/TestStepCard';
import DragPreview from '@/components/test-builder/DragPreview';
import SnapLines from '@/components/test-builder/SnapLines';
import SelectionBox from '@/components/test-builder/SelectionBox';
import useTestSteps from '@/hooks/useTestSteps';
import useCopyPaste from '@/hooks/useCopyPaste';
import useSnapToGrid from '@/hooks/useSnapToGrid';
import useCanvasInteraction from '@/hooks/useCanvasInteraction';
import useConnections from '@/hooks/useConnections';
import useSelection from '@/hooks/useSelection';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import useCanvasStyles from '@/hooks/useCanvasStyles';
import useMouseEvents from '@/hooks/useMouseEvents';
import { getActionByType } from '@/lib/actions';
import { exportTestWorkflow, importTestWorkflow, validateWorkflow, saveWorkflowToStorage, getWorkflowById } from '@/lib/utils';
import SaveDialog from '@/components/test-builder/SaveDialog';

export default function TestBuilder() {
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
  const [enableScreenshots, setEnableScreenshots] = useState(false);
  const [enableRecording, setEnableRecording] = useState(false);
  const [headlessMode, setHeadlessMode] = useState(false);
  
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
      alert('Dışa aktarılacak test adımı bulunamadı.');
      return;
    }

    try {
      const workflowName = `test-workflow-${new Date().toISOString().split('T')[0]}`;
      exportTestWorkflow(testSteps, workflowName);
    } catch (error) {
      console.error('Export error:', error);
      alert('Workflow dışa aktarılırken bir hata oluştu.');
    }
  }, [testSteps]);

  // Handle import workflow
  const handleImport = useCallback(async (file: File) => {
    try {
      const { steps, name } = await importTestWorkflow(file);
      
      // Validate imported workflow
      const validation = validateWorkflow(steps);
      if (!validation.isValid) {
        alert(`Workflow doğrulama hatası:\n${validation.errors.join('\n')}`);
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

      alert(`Workflow başarıyla içe aktarıldı: ${name}\n${newSteps.length} adım eklendi.`);
    } catch (error) {
      console.error('Import error:', error);
      alert(`Workflow içe aktarılırken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }, [testSteps, setTestSteps, saveToHistory, generateId]);

  // Handle save workflow - Updated to show save dialog
  const handleSave = useCallback(() => {
    if (testSteps.length === 0) {
      alert('Kaydedilecek test adımı bulunamadı.');
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
        headlessMode
      });
      
      setIsSaveDialogOpen(false);
      
      if (loadedWorkflowId) {
        alert(`Workflow başarıyla güncellendi: "${data.name}"`);
      } else {
        alert(`Workflow başarıyla kaydedildi: "${data.name}"`);
        setLoadedWorkflowId(workflowId); // Yeni kaydedilen workflow'u track et
      }
      
      // Optional: Clear current workspace or keep it
      // setTestSteps([]);
      // clearSelection();
    } catch (error) {
      alert(`Kaydetme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }, [testSteps, loadedWorkflowId, enableScreenshots, enableRecording, headlessMode]);

  // Handle run workflow - Updated to use backend API
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRun = useCallback(async () => {
    if (testSteps.length === 0) {
      alert('Çalıştırılacak test adımı bulunamadı.');
      return;
    }

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
          workflowId: 'test-builder',
          workflowName: 'Test Builder Workflow',
          steps: backendSteps,
          options: {
            enableScreenshots,
            enableRecording,
            headlessMode
          }
        })
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert(`Test çalıştırılmaya başlandı!\nExecution ID: ${data.executionId}\n\nSonuçları görmek için Tests sayfasını ziyaret edin.`);
      
      // Optional: Navigate to tests page to see results
      // router.push('/tests');
      
    } catch (error) {
      console.error('Test execution error:', error);
      alert(`Test çalıştırılırken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}\n\nBackend server'ın çalıştığından emin olun.`);
    } finally {
      setIsRunning(false);
    }
  }, [testSteps, enableScreenshots, enableRecording, headlessMode]);

  // Load workflow from URL parameter
  useEffect(() => {
    const loadWorkflowId = searchParams.get('load');
    if (loadWorkflowId && loadWorkflowId !== loadedWorkflowId) {
      const workflow = getWorkflowById(loadWorkflowId);
      if (workflow && workflow.workflow) {
        setTestSteps(workflow.workflow);
        setLoadedWorkflowId(loadWorkflowId);
        
        // Load screenshot and recording settings
        setEnableScreenshots(workflow.enableScreenshots || false);
        setEnableRecording(workflow.enableRecording || false);
        setHeadlessMode(workflow.headlessMode || false);
        
        // Show success message
        setTimeout(() => {
          alert(`"${workflow.name}" workflow'u yüklendi!`);
        }, 100);
      } else {
        alert('Workflow bulunamadı veya geçersiz!');
      }
    }
  }, [searchParams, loadedWorkflowId]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ flex: 1, marginLeft: '16rem', paddingTop: '4rem' }}>
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

      <SaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveFromDialog}
        initialData={loadedWorkflowId ? (() => {
          const workflow = getWorkflowById(loadedWorkflowId);
          return workflow ? {
            name: workflow.name,
            description: workflow.description,
            tags: workflow.tags,
            suite: workflow.suite
          } : undefined;
        })() : undefined}
        isUpdating={!!loadedWorkflowId}
      />
    </div>
  );
}