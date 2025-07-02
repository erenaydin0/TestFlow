'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

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

      {/* Step Modal */}
      <StepModal
        isOpen={isModalOpen}
        step={selectedStep}
        onClose={closeModal}
        onUpdateProperty={updateStepProperty}
      />
    </div>
  );
}