'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  GitBranch,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { TestStep } from '@/types';
import FloatingToolbar from '@/components/test-builder/FloatingToolbar';
import ActionsPanel from '@/components/test-builder/ActionsPanel';
import CanvasControls from '@/components/test-builder/CanvasControls';
import StepModal from '@/components/test-builder/StepModal';
import useTestSteps from '@/hooks/useTestSteps';
import useCopyPaste from '@/hooks/useCopyPaste';
import useSnapToGrid from '@/hooks/useSnapToGrid';
import useCanvasInteraction from '@/hooks/useCanvasInteraction';
import useConnections from '@/hooks/useConnections';
import useSelection from '@/hooks/useSelection';
import { availableActions, getActionByType, getActionTitle } from '@/lib/actions';

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

  // Render connection lines with enhanced colors
  const renderConnections = () => {
    const connections: React.JSX.Element[] = [];

    const renderConnection = (fromStep: TestStep, toStepId: string, connectionType: 'normal' | 'true' | 'false') => {
      const toStep = testSteps.find(s => s.id === toStepId);
      if (!toStep) return null;

      const from = getStepCenter(fromStep);
      const to = getStepCenter(toStep);

      // Calculate control points for curved line
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create a curved path
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      
      // Offset the control point to create a curve
      const controlOffset = Math.min(50, distance * 0.3);
      const controlX = midX + (dy / distance) * controlOffset;
      const controlY = midY - (dx / distance) * controlOffset;

      const style = getConnectionStyle(connectionType);
      const pathId = `connection-${fromStep.id}-${toStepId}-${connectionType}`;

      return (
        <g key={pathId}>
          {/* Connection path */}
          <path
            d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
            fill="none"
            stroke={style.color}
            strokeWidth={style.strokeWidth}
            opacity={style.opacity}
            strokeLinecap="round"
          />
          
          {/* Connection label for true/false connections */}
          {style.label && (
            <g>
              {/* Label background */}
              <rect
                x={controlX - 18}
                y={controlY - 8}
                width="36"
                height="16"
                rx="8"
                fill="var(--bg-primary)"
                stroke={style.color}
                strokeWidth="1.5"
                opacity="0.95"
              />
              {/* Label text */}
              <text
                x={controlX}
                y={controlY + 1}
                fill={style.color}
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.9"
              >
                {style.label}
              </text>
            </g>
          )}
          
          {/* Remove connection button */}
          <circle
            cx={controlX + (style.label ? 25 : 0)}
            cy={controlY}
            r="8"
            fill="var(--bg-primary)"
            stroke={style.color}
            strokeWidth="1.5"
            opacity="0.9"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              removeConnection(fromStep.id, toStepId, connectionType, testSteps, setTestSteps, saveToHistory);
            }}
          />
          <text
            x={controlX + (style.label ? 25 : 0)}
            y={controlY + 1}
            fill={style.color}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
            opacity="0.8"
          >
            ×
          </text>
        </g>
      );
    };

    // Render all connections
    testSteps.forEach(step => {
      // Regular connections
      if (step.connections) {
        step.connections.forEach(targetId => {
          const connection = renderConnection(step, targetId, 'normal');
          if (connection) {
            connections.push(connection);
          }
        });
      }

      // True/False connections for IF steps
      if (step.type === 'if') {
        if (step.trueConnection) {
          const connection = renderConnection(step, step.trueConnection, 'true');
          if (connection) {
            connections.push(connection);
          }
        }
        if (step.falseConnection) {
          const connection = renderConnection(step, step.falseConnection, 'false');
          if (connection) {
            connections.push(connection);
          }
        }
      }
    });

    return connections;
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
                {renderConnections()}
                
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
              {dragPreview && (() => {
                // Get the step being dragged or the action being added
                const draggedStepData = draggedStep ? testSteps.find(s => s.id === draggedStep) : null;
                const action = draggedStepData 
                  ? getActionByType(draggedStepData.type)
                  : getActionByType(dragPreview.type);
                
                if (!action) return null;
                const Icon = action.icon;
                
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: dragPreview.x,
                      top: dragPreview.y,
                      width: '12rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: `2px dashed ${action.color}`,
                      borderRadius: '0.5rem',
                      opacity: 0.7,
                      pointerEvents: 'none',
                      zIndex: 999,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          padding: '0.25rem',
                          backgroundColor: `${action.color}15`,
                          borderRadius: '0.25rem'
                        }}>
                          <Icon size={14} color={action.color} />
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 500, 
                          color: 'var(--text-primary)'
                        }}>
                          {action.title}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      minHeight: '2rem',
                      wordBreak: 'break-all'
                    }}>
                      {/* Show step content if it's a dragged step, otherwise show preview message */}
                      {draggedStepData ? (
                        <>
                          {/* Step description or configuration preview */}
                          {draggedStepData.description ? (
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-primary)',
                              fontStyle: 'italic',
                              marginBottom: '0.25rem',
                              lineHeight: '1.3'
                            }}>
                              "{draggedStepData.description}"
                            </div>
                          ) : (
                            <>
                              {/* Step configuration preview */}
                              {draggedStepData.type === 'navigate' && (
                                <span>URL: {draggedStepData.url || 'Belirtilmedi'}</span>
                              )}
                              {draggedStepData.type === 'click' && (
                                <span>Element: {draggedStepData.selector || 'Belirtilmedi'}</span>
                              )}
                              {draggedStepData.type === 'input' && (
                                <span>
                                  {draggedStepData.selector ? `${draggedStepData.selector}: ` : 'Input: '}
                                  {draggedStepData.value || 'Belirtilmedi'}
                                </span>
                              )}
                              {draggedStepData.type === 'wait' && (
                                <span>Süre: {draggedStepData.duration || 1000}ms</span>
                              )}
                              {draggedStepData.type === 'refresh' && 'Sayfa yenileme'}
                              {draggedStepData.type === 'if' && (
                                <span>Koşul: {draggedStepData.condition || 'Belirtilmedi'}</span>
                              )}
                            </>
                          )}
                          
                          {/* Show both description and config if description exists */}
                          {draggedStepData.description && (
                            <div style={{
                              fontSize: '0.65rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.25rem'
                            }}>
                              {draggedStepData.type === 'navigate' && draggedStepData.url && `URL: ${draggedStepData.url}`}
                              {draggedStepData.type === 'click' && draggedStepData.selector && `Element: ${draggedStepData.selector}`}
                              {draggedStepData.type === 'input' && draggedStepData.value && `Input: ${draggedStepData.value}`}
                              {draggedStepData.type === 'wait' && `Süre: ${draggedStepData.duration || 1000}ms`}
                              {draggedStepData.type === 'refresh' && 'Sayfa yenileme'}
                              {draggedStepData.type === 'if' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {draggedStepData.condition && `Koşul: ${draggedStepData.condition}`}
                                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6rem' }}>
                                    <span style={{ 
                                      color: draggedStepData.trueConnection ? '#22c55e' : 'var(--text-tertiary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      <CheckCircle size={8} />
                                      TRUE: {draggedStepData.trueConnection ? '✓' : 'Bağlı değil'}
                                    </span>
                                    <span style={{ 
                                      color: draggedStepData.falseConnection ? '#ef4444' : 'var(--text-tertiary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      <XCircle size={8} />
                                      FALSE: {draggedStepData.falseConnection ? '✓' : 'Bağlı değil'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontStyle: 'italic',
                          height: '2rem'
                        }}>
                          Buraya bırakılacak
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Render test steps */}
              {testSteps.map((step) => {
                const action = getActionByType(step.type);
                if (!action) return null;
                
                const Icon = action.icon;
                const isSelected = selectedStep === step;
                const isMultiSelected = selectedSteps.has(step.id);
                
                return (
                  <div
                    key={step.id}
                    data-step-id={step.id}
                    draggable
                    onDragStart={(e) => {
                      handleStepDragStart(step.id);
                      // Make drag image more visible
                      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                      dragImage.style.transform = 'scale(1.1)';
                      dragImage.style.opacity = '0.8';
                      e.dataTransfer.setDragImage(dragImage, 96, 40);
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(step, e.ctrlKey || e.metaKey);
                    }}
                    onMouseDown={(e) => {
                      // Prevent canvas panning when dragging steps
                      e.stopPropagation();
                    }}
                    style={{
                      position: 'absolute',
                      left: step.x,
                      top: step.y,
                      width: '12rem',
                      padding: '0.75rem',
                      backgroundColor: isMultiSelected ? `${action.color}10` : 'var(--bg-primary)',
                      border: `2px solid ${isSelected ? action.color : isMultiSelected ? action.color : 'var(--border-primary)'}`,
                      borderRadius: '0.5rem',
                      cursor: draggedStep === step.id ? 'grabbing' : 'grab',
                      boxShadow: isSelected || isMultiSelected
                        ? `0 4px 12px ${action.color}30` 
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      transition: draggedStep === step.id ? 'none' : 'all 0.2s ease',
                      opacity: draggedStep === step.id ? 0.5 : 1,
                      zIndex: draggedStep === step.id ? 1000 : 5
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          padding: '0.25rem',
                          backgroundColor: `${action.color}15`,
                          borderRadius: '0.25rem'
                        }}>
                          <Icon size={14} color={action.color} />
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 500, 
                          color: 'var(--text-primary)'
                        }}>
                          {action.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {/* If step special connection buttons */}
                        {step.type === 'if' ? (
                          <>
                            {/* True branch button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isConnecting && connectionStart === step.id && connectionType === 'true') {
                                  setIsConnecting(false);
                                  setConnectionStart(null);
                                  setConnectionType('normal');
                                } else if (isConnecting && connectionStart !== step.id) {
                                  endConnection(step.id, testSteps, setTestSteps, saveToHistory);
                                } else {
                                  startConnection(step.id, 'true');
                                }
                              }}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: isConnecting && connectionStart === step.id && connectionType === 'true'
                                  ? '#22c55e' 
                                  : 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                color: isConnecting && connectionStart === step.id && connectionType === 'true'
                                  ? 'white' 
                                  : '#22c55e',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                                  e.currentTarget.style.backgroundColor = '#dcfce7';
                                  e.currentTarget.style.color = '#16a34a';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#22c55e';
                                }
                              }}
                              title={isConnecting && connectionStart === step.id && connectionType === 'true'
                                ? 'TRUE bağlantısını iptal et' 
                                : isConnecting 
                                  ? 'TRUE dalına bağla' 
                                  : 'TRUE dalı bağlantısı başlat'}
                            >
                              <CheckCircle size={12} />
                            </button>
                            
                            {/* False branch button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isConnecting && connectionStart === step.id && connectionType === 'false') {
                                  setIsConnecting(false);
                                  setConnectionStart(null);
                                  setConnectionType('normal');
                                } else if (isConnecting && connectionStart !== step.id) {
                                  endConnection(step.id, testSteps, setTestSteps, saveToHistory);
                                } else {
                                  startConnection(step.id, 'false');
                                }
                              }}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: isConnecting && connectionStart === step.id && connectionType === 'false'
                                  ? '#ef4444' 
                                  : 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                color: isConnecting && connectionStart === step.id && connectionType === 'false'
                                  ? 'white' 
                                  : '#ef4444',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                  e.currentTarget.style.color = '#dc2626';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#ef4444';
                                }
                              }}
                              title={isConnecting && connectionStart === step.id && connectionType === 'false'
                                ? 'FALSE bağlantısını iptal et' 
                                : isConnecting 
                                  ? 'FALSE dalına bağla' 
                                : 'FALSE dalı bağlantısı başlat'}
                            >
                              <XCircle size={12} />
                            </button>
                          </>
                        ) : (
                          /* Regular connection button for non-if steps */
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isConnecting && connectionStart === step.id) {
                                // Cancel connection
                                setIsConnecting(false);
                                setConnectionStart(null);
                                setConnectionType('normal');
                              } else if (isConnecting && connectionStart !== step.id) {
                                // End connection
                                endConnection(step.id, testSteps, setTestSteps, saveToHistory);
                              } else {
                                // Start connection
                                startConnection(step.id);
                              }
                            }}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: isConnecting && connectionStart === step.id 
                                ? '#3b82f6' 
                                : 'transparent',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: isConnecting && connectionStart === step.id 
                                ? 'white' 
                                : 'var(--text-tertiary)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!(isConnecting && connectionStart === step.id)) {
                                e.currentTarget.style.backgroundColor = '#dbeafe';
                                e.currentTarget.style.color = '#3b82f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(isConnecting && connectionStart === step.id)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-tertiary)';
                              }
                            }}
                            title={isConnecting && connectionStart === step.id 
                              ? 'Bağlantıyı iptal et' 
                              : isConnecting 
                                ? 'Buraya bağla' 
                                : 'Bağlantı başlat'}
                          >
                            <GitBranch size={12} />
                          </button>
                        )}
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStep(step.id, () => {
                              const newSet = new Set(selectedSteps);
                              newSet.delete(step.id);
                              setSelectedSteps(newSet);
                              if (selectedStep && selectedStep.id === step.id) {
                                setSelectedStep(null);
                              }
                            });
                          }}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      minHeight: '2rem',
                      wordBreak: 'break-all'
                    }}>
                      {/* Step description or configuration preview */}
                      {step.description ? (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-primary)',
                          fontStyle: 'italic',
                          marginBottom: '0.25rem',
                          lineHeight: '1.3'
                        }}>
                          "{step.description}"
                        </div>
                      ) : (
                        <>
                          {/* Step configuration preview */}
                          {step.type === 'navigate' && (
                            <span>URL: {step.url || 'Belirtilmedi'}</span>
                          )}
                          {step.type === 'click' && (
                            <span>Element: {step.selector || 'Belirtilmedi'}</span>
                          )}
                          {step.type === 'input' && (
                            <span>
                              {step.selector ? `${step.selector}: ` : 'Input: '}
                              {step.value || 'Belirtilmedi'}
                            </span>
                          )}
                          {step.type === 'wait' && (
                            <span>Süre: {step.duration || 1000}ms</span>
                          )}
                          {step.type === 'refresh' && 'Sayfa yenileme'}
                          {step.type === 'if' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span>Koşul: {step.condition || 'Belirtilmedi'}</span>
                              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem' }}>
                                <span style={{ 
                                  color: step.trueConnection ? '#22c55e' : 'var(--text-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <CheckCircle size={10} />
                                  TRUE: {step.trueConnection ? '✓' : 'Bağlı değil'}
                                </span>
                                <span style={{ 
                                  color: step.falseConnection ? '#ef4444' : 'var(--text-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <XCircle size={10} />
                                  FALSE: {step.falseConnection ? '✓' : 'Bağlı değil'}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Show both description and config if description exists */}
                      {step.description && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-tertiary)',
                          marginTop: '0.25rem'
                        }}>
                          {step.type === 'navigate' && step.url && `URL: ${step.url}`}
                          {step.type === 'click' && step.selector && `Element: ${step.selector}`}
                          {step.type === 'input' && step.value && `Input: ${step.value}`}
                          {step.type === 'wait' && `Süre: ${step.duration || 1000}ms`}
                          {step.type === 'refresh' && 'Sayfa yenileme'}
                          {step.type === 'if' && step.condition && `Koşul: ${step.condition}`}
                        </div>
                      )}
                    </div>
                  </div>
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