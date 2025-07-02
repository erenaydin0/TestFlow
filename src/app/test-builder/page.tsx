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
import useTestSteps from '@/hooks/useTestSteps';
import useCopyPaste from '@/hooks/useCopyPaste';
import useSnapToGrid from '@/hooks/useSnapToGrid';
import useCanvasInteraction from '@/hooks/useCanvasInteraction';
import useConnections from '@/hooks/useConnections';
import useSelection from '@/hooks/useSelection';
import { getActionByType } from '@/lib/actions';

export default function TestBuilder() {
  const {
    testSteps,
    setTestSteps,
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveToHistory,
    undo,
    redo,
    addStep,
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
    setCopiedSteps,
    selectAllSteps,
    clearSelection,
    toggleStepSelection,
    copySteps,
    pasteSteps,
    duplicateSteps
  } = useCopyPaste();

  const {
    snapEnabled,
    setSnapEnabled,
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
    setZoom,
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
    isDragOver,
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
    setIsSelecting: setSelectionIsSelecting,
    selectionBox: selectionSelectionBox,
    setSelectionBox: setSelectionSelectionBox,
    selectionStart,
    setSelectionStart,
    handleCanvasMouseDown: selectionHandleCanvasMouseDown,
    handleCanvasMouseMove: selectionHandleCanvasMouseMove,
    handleCanvasMouseUp: selectionHandleCanvasMouseUp,
    getStepsInSelectionBox,
    handleStepClick: selectionHandleStepClick
  } = useSelection();

  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const stepsToDelete = Array.from(selectedSteps);
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when modal is open or input is focused
      if (isModalOpen || (e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            copySteps(testSteps);
            break;
          case 'v':
            e.preventDefault();
            pasteSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            });
            break;
          case 'd':
            e.preventDefault();
            duplicateSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            });
            break;
          case 'a':
            e.preventDefault();
            selectAllSteps(testSteps);
            break;
          case 'z':
            e.preventDefault();
            undo(() => {
              setSelectedSteps(new Set());
              setSelectedStep(null);
            });
            break;
          case 'y':
            e.preventDefault();
            redo(() => {
              setSelectedSteps(new Set());
              setSelectedStep(null);
            });
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            deleteSelectedSteps();
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSteps, copiedSteps, isModalOpen]);

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

  // Mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
    };

    const handleMouseUp = (e: MouseEvent) => {
      selectionHandleCanvasMouseUp(e, setIsPanning);
    };

    if (selectionIsSelecting || isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [selectionIsSelecting, isPanning, zoom, canvasOffset, panStart, testSteps]);



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
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              cursor: isPanning ? 'grabbing' : 'grab',
              backgroundImage: `
                radial-gradient(circle, var(--border-primary) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <div style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              position: 'relative'
            }}>
              {/* SVG Layer for connections and snap lines */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <ConnectionRenderer
                  testSteps={testSteps}
                  getStepCenter={getStepCenter}
                  getConnectionStyle={getConnectionStyle}
                  removeConnection={removeConnection}
                  setTestSteps={setTestSteps}
                  saveToHistory={saveToHistory}
                />
                
                {/* Snap lines */}
                {snapEnabled && (
                  <g>
                    {/* Vertical snap lines */}
                    {snapLines.x.map((x, index) => (
                      <line
                        key={`snap-x-${index}`}
                        x1={x}
                        y1={0}
                        x2={x}
                        y2="100%"
                        stroke="#3b82f6"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.6"
                      />
                    ))}
                    
                    {/* Horizontal snap lines */}
                    {snapLines.y.map((y, index) => (
                      <line
                        key={`snap-y-${index}`}
                        x1={0}
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke="#3b82f6"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.6"
                      />
                    ))}
                  </g>
                )}
                
                {/* Selection box */}
                {selectionSelectionBox && (
                  <rect
                    x={selectionSelectionBox.x}
                    y={selectionSelectionBox.y}
                    width={selectionSelectionBox.width}
                    height={selectionSelectionBox.height}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    opacity="0.8"
                  />
                )}
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

      <style jsx>{`
        .toolbar-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        
        .toolbar-button:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--primary);
        }
        
        .canvas-control {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        
        .canvas-control:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}