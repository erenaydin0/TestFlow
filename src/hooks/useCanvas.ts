import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TestStep } from '@/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface DragPreview {
  x: number;
  y: number;
  type: string;
}

interface CanvasStylesParams {
  zoom: number;
  pan: { x: number; y: number };
  canvasOffset: { x: number; y: number };
  isPanning: boolean;
}

interface CanvasStyles {
  canvasContainer: React.CSSProperties;
  innerContainer: React.CSSProperties;
  svgLayer: React.CSSProperties;
}

interface SnapLines {
  x: number[];
  y: number[];
}

interface SnapResult {
  x: number;
  y: number;
  snapLines: SnapLines;
}

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseCanvasReturn {
  // Canvas Core State
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasOffset: { x: number; y: number };
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (start: { x: number; y: number }) => void;
  
  // Drag State
  draggedAction: string | null;
  setDraggedAction: (action: string | null) => void;
  draggedStep: string | null;
  setDraggedStep: (step: string | null) => void;
  isDragOver: boolean;
  setIsDragOver: (dragOver: boolean) => void;
  dragPreview: DragPreview | null;
  setDragPreview: (preview: DragPreview | null) => void;
  
  // Selection State
  selectedSteps: Set<string>;
  setSelectedSteps: (steps: Set<string>) => void;
  selectedStep: TestStep | null;
  setSelectedStep: (step: TestStep | null) => void;
  isSelecting: boolean;
  setIsSelecting: (selecting: boolean) => void;
  selectionBox: SelectionBox | null;
  setSelectionBox: (box: SelectionBox | null) => void;
  selectionStart: { x: number; y: number } | null;
  setSelectionStart: (start: { x: number; y: number } | null) => void;
  
  // Copied Steps State
  copiedSteps: TestStep[];
  setCopiedSteps: (steps: TestStep[]) => void;
  
  // Connection State
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;
  connectionStart: string | null;
  setConnectionStart: (start: string | null) => void;
  connectionType: 'normal' | 'true' | 'false';
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  
  // Snap State
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  snapLines: SnapLines;
  setSnapLines: (lines: SnapLines) => void;
  
  // Canvas Styles
  canvasStyles: CanvasStyles;
  
  // Core Operations
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  
  // Drag Operations
  handleActionDragStart: (actionType: string) => void;
  handleStepDragStart: (stepId: string) => void;
  handleDragEnd: () => void;
  
  // Canvas Event Handlers
  handleCanvasDragOver: (e: React.DragEvent, snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any, testSteps: TestStep[], setSnapLines: (lines: any) => void) => void;
  handleCanvasDragEnter: (e: React.DragEvent, snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any, testSteps: TestStep[], setSnapLines: (lines: any) => void) => void;
  handleCanvasDragLeave: (e: React.DragEvent, clearSnapLines: () => void) => void;
  
  // Selection Operations
  selectAllSteps: (allSteps: TestStep[]) => void;
  clearSelection: () => void;
  toggleStepSelection: (stepId: string, ctrlKey?: boolean) => void;
  
  // Copy/Paste Operations
  copySteps: (testSteps: TestStep[]) => void;
  pasteSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
  duplicateSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
  
  // Mouse Event Handlers
  handleCanvasMouseDown: (e: React.MouseEvent, canvasRef: React.RefObject<HTMLDivElement | null>, zoom: number, canvasOffset: { x: number; y: number }, isPanning: boolean, setIsPanning: (panning: boolean) => void, setPanStart: (start: { x: number; y: number }) => void, testSteps: TestStep[], selectedSteps: Set<string>, setSelectedSteps: (steps: Set<string>) => void, setSelectedStep: (step: TestStep | null) => void) => void;
  handleCanvasMouseMove: (e: MouseEvent, canvasRef: React.RefObject<HTMLDivElement | null>, zoom: number, canvasOffset: { x: number; y: number }, isPanning: boolean, panStart: { x: number; y: number }, setPan: (pan: { x: number; y: number }) => void, setCanvasOffset: (offset: { x: number; y: number }) => void, testSteps: TestStep[], setSelectedSteps: (steps: Set<string>) => void) => void;
  handleCanvasMouseUp: (e: MouseEvent, setIsPanning: (panning: boolean) => void) => void;
  
  // Selection Utilities
  getStepsInSelectionBox: (testSteps: TestStep[], selectionBox: SelectionBox) => TestStep[];
  handleStepClick: (step: TestStep, ctrlKey: boolean, selectedSteps: Set<string>, setSelectedSteps: (steps: Set<string>) => void, setSelectedStep: (step: TestStep | null) => void) => void;
  
  // Connection Operations
  startConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  endConnection: (stepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  removeConnection: (fromStepId: string, toStepId: string, type: 'normal' | 'true' | 'false', testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  
  // Snap Operations
  snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => SnapResult;
  clearSnapLines: () => void;
  toggleSnap: () => void;
  
  // Helper Functions
  getStepCenter: (step: TestStep) => { x: number; y: number };
  getConnectionStyle: (type: 'normal' | 'true' | 'false') => { color: string; strokeWidth: number; opacity: number; label: string };
}

// ============================================================================
// useCanvas Hook
// ============================================================================

const useCanvas = (): UseCanvasReturn => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // ============================================================================
  // Canvas Core State
  // ============================================================================
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // ============================================================================
  // Drag State
  // ============================================================================
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  
  // ============================================================================
  // Selection State
  // ============================================================================
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  
  // ============================================================================
  // Copied Steps State
  // ============================================================================
  const [copiedSteps, setCopiedSteps] = useState<TestStep[]>([]);
  
  // ============================================================================
  // Connection State
  // ============================================================================
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'normal' | 'true' | 'false'>('normal');
  
  // ============================================================================
  // Snap State
  // ============================================================================
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<SnapLines>({ x: [], y: [] });

  // ============================================================================
  // Canvas Styles
  // ============================================================================
  const canvasStyles = useMemo(() => ({
    canvasContainer: {
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      cursor: isPanning ? 'grabbing' : 'grab',
      backgroundImage: `
        radial-gradient(circle, var(--border-primary) 1px, transparent 1px)
      `,
      backgroundSize: `${20}px ${20}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
      overflow: 'hidden' as const
    },
    innerContainer: {
      transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      minWidth: '1000px',
      minHeight: '1000px'
    },
    svgLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
      zIndex: 1,
      overflow: 'visible' as const
    }
  }), [zoom, pan.x, pan.y, canvasOffset.x, canvasOffset.y, isPanning]);

  // ============================================================================
  // Core Operations
  // ============================================================================
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
    setPan({ x: 0, y: 0 });
  }, []);

  // ============================================================================
  // Drag Operations
  // ============================================================================
  const handleActionDragStart = useCallback((actionType: string) => {
    setDraggedAction(actionType);
    setDraggedStep(null);
  }, []);

  const handleStepDragStart = useCallback((stepId: string) => {
    setDraggedStep(stepId);
    setDraggedAction(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      setDraggedAction(null);
      setDraggedStep(null);
      setDragPreview(null);
      setIsDragOver(false);
    }, 100);
  }, []);

  // ============================================================================
  // Canvas Event Handlers
  // ============================================================================
  const handleCanvasDragOver = useCallback((
    e: React.DragEvent,
    snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any,
    testSteps: TestStep[],
    setSnapLines: (lines: any) => void
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedAction ? 'copy' : 'move';
    setIsDragOver(true);
    
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const centeredX = rawX - 96;
      const centeredY = rawY - 40;
      
      const snapped = snapToPosition(centeredX, centeredY, testSteps, draggedStep || undefined);
      
      setSnapLines(snapped.snapLines);
      
      if (draggedAction) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: 'step' });
      }
    }
  }, [draggedAction, draggedStep, canvasOffset, zoom]);

  const handleCanvasDragEnter = useCallback((
    e: React.DragEvent,
    snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any,
    testSteps: TestStep[],
    setSnapLines: (lines: any) => void
  ) => {
    e.preventDefault();
    setIsDragOver(true);
    
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const centeredX = rawX - 96;
      const centeredY = rawY - 40;
      
      const snapped = snapToPosition(centeredX, centeredY, testSteps, draggedStep || undefined);
      
      setSnapLines(snapped.snapLines);
      
      if (draggedAction) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: 'step' });
      }
    }
  }, [draggedAction, draggedStep, canvasOffset, zoom]);

  const handleCanvasDragLeave = useCallback((
    e: React.DragEvent,
    clearSnapLines: () => void
  ) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragPreview(null);
      clearSnapLines();
    }
  }, []);

  // ============================================================================
  // Selection Operations
  // ============================================================================
  const selectAllSteps = useCallback((allSteps: TestStep[]) => {
    const allStepIds = new Set(allSteps.map(step => step.id));
    setSelectedSteps(allStepIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSteps(new Set());
    setSelectedStep(null);
  }, []);

  const toggleStepSelection = useCallback((stepId: string, ctrlKey: boolean = false) => {
    setSelectedSteps(prev => {
      const newSet = new Set(prev);
      
      if (ctrlKey) {
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
      } else {
        newSet.clear();
        newSet.add(stepId);
      }
      
      return newSet;
    });
  }, []);

  // ============================================================================
  // Copy/Paste Operations
  // ============================================================================
  const copySteps = useCallback((testSteps: TestStep[]) => {
    if (selectedSteps.size === 0) return;
    
    const stepsToCopy = testSteps.filter(step => selectedSteps.has(step.id));
    setCopiedSteps(stepsToCopy);
  }, [selectedSteps]);

  const pasteSteps = useCallback((
    testSteps: TestStep[], 
    generateId: () => string, 
    onStepsChange: (steps: TestStep[]) => void
  ) => {
    if (copiedSteps.length === 0) return;

    const minX = Math.min(...copiedSteps.map(step => step.x));
    const minY = Math.min(...copiedSteps.map(step => step.y));

    const offsetX = 50;
    const offsetY = 50;

    const pastedSteps = copiedSteps.map(step => ({
      ...step,
      id: generateId(),
      x: step.x - minX + offsetX,
      y: step.y - minY + offsetY,
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...pastedSteps];
    onStepsChange(newSteps);
    
    const newStepIds = new Set(pastedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  }, [copiedSteps]);

  const duplicateSteps = useCallback((
    testSteps: TestStep[], 
    generateId: () => string, 
    onStepsChange: (steps: TestStep[]) => void
  ) => {
    if (selectedSteps.size === 0) return;
    
    const stepsToDuplicate = testSteps.filter(step => selectedSteps.has(step.id));
    
    const duplicatedSteps = stepsToDuplicate.map(step => ({
      ...step,
      id: generateId(),
      x: step.x + 50,
      y: step.y + 50,
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...duplicatedSteps];
    onStepsChange(newSteps);
    
    const newStepIds = new Set(duplicatedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  }, [selectedSteps]);

  // ============================================================================
  // Mouse Event Handlers
  // ============================================================================
  const handleCanvasMouseDown = useCallback((
    e: React.MouseEvent,
    canvasRef: React.RefObject<HTMLDivElement | null>,
    zoom: number,
    canvasOffset: { x: number; y: number },
    isPanning: boolean,
    setIsPanning: (panning: boolean) => void,
    setPanStart: (start: { x: number; y: number }) => void,
    testSteps: TestStep[],
    selectedSteps: Set<string>,
    setSelectedSteps: (steps: Set<string>) => void,
    setSelectedStep: (step: TestStep | null) => void
  ) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const canvasX = (clientX - canvasOffset.x) / zoom;
    const canvasY = (clientY - canvasOffset.y) / zoom;

    const clickedStep = testSteps.find(step => {
      const stepLeft = step.x;
      const stepRight = step.x + 192;
      const stepTop = step.y;
      const stepBottom = step.y + 80;

      return canvasX >= stepLeft && canvasX <= stepRight && 
             canvasY >= stepTop && canvasY <= stepBottom;
    });

    if (clickedStep) {
      handleStepClick(clickedStep, e.ctrlKey, selectedSteps, setSelectedSteps, setSelectedStep);
    } else if (e.button === 0) {
      if (e.ctrlKey || e.metaKey) {
        setIsSelecting(true);
        setSelectionStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
      } else {
        if (!isPanning) {
          setSelectedSteps(new Set());
          setSelectedStep(null);
        }
        
        setIsPanning(true);
        setPanStart({ x: clientX, y: clientY });
      }
    }
  }, []);

  const handleCanvasMouseMove = useCallback((
    e: MouseEvent,
    canvasRef: React.RefObject<HTMLDivElement | null>,
    zoom: number,
    canvasOffset: { x: number; y: number },
    isPanning: boolean,
    panStart: { x: number; y: number },
    setPan: (pan: { x: number; y: number }) => void,
    setCanvasOffset: (offset: { x: number; y: number }) => void,
    testSteps: TestStep[],
    setSelectedSteps: (steps: Set<string>) => void
  ) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isPanning) {
      // Handle panning
    } else if (isSelecting && selectionStart) {
      const canvasX = (clientX - canvasOffset.x) / zoom;
      const canvasY = (clientY - canvasOffset.y) / zoom;

      const newSelectionBox = {
        x: Math.min(selectionStart.x, canvasX),
        y: Math.min(selectionStart.y, canvasY),
        width: Math.abs(canvasX - selectionStart.x),
        height: Math.abs(canvasY - selectionStart.y)
      };

      setSelectionBox(newSelectionBox);

      const stepsInBox = getStepsInSelectionBox(testSteps, newSelectionBox);
      setSelectedSteps(new Set(stepsInBox.map(step => step.id)));
    }
  }, [isSelecting, selectionStart]);

  const handleCanvasMouseUp = useCallback((
    e: MouseEvent,
    setIsPanning: (panning: boolean) => void
  ) => {
    setIsPanning(false);
    
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
    }
  }, [isSelecting]);

  // ============================================================================
  // Selection Utilities
  // ============================================================================
  const getStepsInSelectionBox = useCallback((testSteps: TestStep[], box: SelectionBox) => {
    return testSteps.filter(step => {
      const stepCenterX = step.x + 96;
      const stepCenterY = step.y + 40;

      return stepCenterX >= box.x && 
             stepCenterX <= box.x + box.width &&
             stepCenterY >= box.y && 
             stepCenterY <= box.y + box.height;
    });
  }, []);

  const handleStepClick = useCallback((
    step: TestStep,
    ctrlKey: boolean,
    selectedSteps: Set<string>,
    setSelectedSteps: (steps: Set<string>) => void,
    setSelectedStep: (step: TestStep | null) => void
  ) => {
    if (ctrlKey) {
      const newSelectedSteps = new Set(selectedSteps);
      if (selectedSteps.has(step.id)) {
        newSelectedSteps.delete(step.id);
        setSelectedStep(newSelectedSteps.size > 0 ? step : null);
      } else {
        newSelectedSteps.add(step.id);
        setSelectedStep(step);
      }
      setSelectedSteps(newSelectedSteps);
    } else {
      setSelectedSteps(new Set([step.id]));
      setSelectedStep(step);
    }
  }, []);

  // ============================================================================
  // Connection Operations
  // ============================================================================
  const startConnection = useCallback((stepId: string, type: 'normal' | 'true' | 'false' = 'normal') => {
    setIsConnecting(true);
    setConnectionStart(stepId);
    setConnectionType(type);
  }, []);

  const endConnection = useCallback((
    stepId: string,
    testSteps: TestStep[],
    setTestSteps: (steps: TestStep[]) => void,
    saveToHistory: (steps: TestStep[]) => void
  ) => {
    if (!connectionStart || connectionStart === stepId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    const sourceStep = testSteps.find(s => s.id === connectionStart);
    
    const newSteps = testSteps.map(step => {
      if (step.id === connectionStart) {
        if (sourceStep?.type === 'if' && connectionType !== 'normal') {
          return {
            ...step,
            [connectionType === 'true' ? 'trueConnection' : 'falseConnection']: stepId
          };
        } else {
          const connections = step.connections || [];
          if (!connections.includes(stepId)) {
            return {
              ...step,
              connections: [...connections, stepId]
            };
          }
        }
      }
      return step;
    });

    setTestSteps(newSteps);
    saveToHistory(newSteps);
    setIsConnecting(false);
    setConnectionStart(null);
  }, [connectionStart, connectionType]);

  const removeConnection = useCallback((
    fromStepId: string,
    toStepId: string,
    type: 'normal' | 'true' | 'false',
    testSteps: TestStep[],
    setTestSteps: (steps: TestStep[]) => void,
    saveToHistory: (steps: TestStep[]) => void
  ) => {
    const newSteps = testSteps.map(step => {
      if (step.id === fromStepId) {
        if (type === 'true') {
          return { ...step, trueConnection: undefined };
        } else if (type === 'false') {
          return { ...step, falseConnection: undefined };
        } else if (step.connections) {
          return {
            ...step,
            connections: step.connections.filter(id => id !== toStepId)
          };
        }
      }
      return step;
    });

    setTestSteps(newSteps);
    saveToHistory(newSteps);
  }, []);

  // ============================================================================
  // Snap Operations
  // ============================================================================
  const clearSnapLines = useCallback(() => {
    setSnapLines({ x: [], y: [] });
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapEnabled(prev => !prev);
  }, []);

  const snapToPosition = useCallback((
    x: number, 
    y: number, 
    testSteps: TestStep[], 
    excludeStepId?: string
  ): SnapResult => {
    if (!snapEnabled) {
      return { x, y, snapLines: { x: [], y: [] } };
    }

    const SNAP_THRESHOLD = 15;
    const GRID_SIZE = 20;
    let snappedX = x;
    let snappedY = y;
    const activeSnapLines = { x: [] as number[], y: [] as number[] };

    // Snap to grid
    const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    
    if (Math.abs(x - gridX) < SNAP_THRESHOLD) {
      snappedX = gridX;
    }
    if (Math.abs(y - gridY) < SNAP_THRESHOLD) {
      snappedY = gridY;
    }

    // Snap to other steps
    const otherSteps = testSteps.filter(step => step.id !== excludeStepId);
    
    for (const step of otherSteps) {
      const stepCenterX = step.x + 96;
      const stepCenterY = step.y + 40;
      const stepLeft = step.x;
      const stepRight = step.x + 192;
      const stepTop = step.y;
      const stepBottom = step.y + 80;

      // Horizontal alignment
      if (Math.abs(y - step.y) < SNAP_THRESHOLD) {
        snappedY = step.y;
        activeSnapLines.y.push(step.y);
      } else if (Math.abs(y - stepCenterY) < SNAP_THRESHOLD) {
        snappedY = stepCenterY - 40;
        activeSnapLines.y.push(stepCenterY);
      } else if (Math.abs(y - stepBottom) < SNAP_THRESHOLD) {
        snappedY = stepBottom;
        activeSnapLines.y.push(stepBottom);
      }

      // Vertical alignment
      if (Math.abs(x - step.x) < SNAP_THRESHOLD) {
        snappedX = step.x;
        activeSnapLines.x.push(step.x);
      } else if (Math.abs(x - stepCenterX) < SNAP_THRESHOLD) {
        snappedX = stepCenterX - 96;
        activeSnapLines.x.push(stepCenterX);
      } else if (Math.abs(x - stepRight) < SNAP_THRESHOLD) {
        snappedX = stepRight;
        activeSnapLines.x.push(stepRight);
      }

      // Spacing alignment
      const COMMON_SPACING = [50, 100, 150, 200, 250];
      for (const spacing of COMMON_SPACING) {
        if (Math.abs(x - (stepRight + spacing)) < SNAP_THRESHOLD) {
          snappedX = stepRight + spacing;
          activeSnapLines.x.push(stepRight + spacing);
        }
        if (Math.abs(x - (stepLeft - spacing - 192)) < SNAP_THRESHOLD) {
          snappedX = stepLeft - spacing - 192;
          activeSnapLines.x.push(stepLeft - spacing);
        }

        if (Math.abs(y - (stepBottom + spacing)) < SNAP_THRESHOLD) {
          snappedY = stepBottom + spacing;
          activeSnapLines.y.push(stepBottom + spacing);
        }
        if (Math.abs(y - (stepTop - spacing - 80)) < SNAP_THRESHOLD) {
          snappedY = stepTop - spacing - 80;
          activeSnapLines.y.push(stepTop - spacing);
        }
      }
    }

    return { 
      x: Math.max(0, snappedX), 
      y: Math.max(0, snappedY), 
      snapLines: activeSnapLines 
    };
  }, [snapEnabled]);

  // ============================================================================
  // Helper Functions
  // ============================================================================
  const getStepCenter = useCallback((step: TestStep) => {
    return {
      x: step.x + 96,
      y: step.y + 40
    };
  }, []);

  const getConnectionStyle = useCallback((type: 'normal' | 'true' | 'false') => {
    switch (type) {
      case 'true':
        return { 
          color: 'var(--status-success)',
          strokeWidth: 3,
          opacity: 0.9,
          label: 'TRUE'
        };
      case 'false':
        return { 
          color: 'var(--status-error)',
          strokeWidth: 3,
          opacity: 0.9,
          label: 'FALSE'
        };
      default:
        return { 
          color: '#6B7280', // Daha belirgin gri renk
          strokeWidth: 2.5,
          opacity: 0.8,
          label: ''
        };
    }
  }, []);

  // ============================================================================
  // Return All Canvas Functionality
  // ============================================================================
  return {
    // Canvas Core State
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
    
    // Drag State
    draggedAction,
    setDraggedAction,
    draggedStep,
    setDraggedStep,
    isDragOver,
    setIsDragOver,
    dragPreview,
    setDragPreview,
    
    // Selection State
    selectedSteps,
    setSelectedSteps,
    selectedStep,
    setSelectedStep,
    isSelecting,
    setIsSelecting,
    selectionBox,
    setSelectionBox,
    selectionStart,
    setSelectionStart,
    
    // Copied Steps State
    copiedSteps,
    setCopiedSteps,
    
    // Connection State
    isConnecting,
    setIsConnecting,
    connectionStart,
    setConnectionStart,
    connectionType,
    setConnectionType,
    
    // Snap State
    snapEnabled,
    setSnapEnabled,
    snapLines,
    setSnapLines,
    
    // Canvas Styles
    canvasStyles,
    
    // Core Operations
    zoomIn,
    zoomOut,
    resetView,
    
    // Drag Operations
    handleActionDragStart,
    handleStepDragStart,
    handleDragEnd,
    
    // Canvas Event Handlers
    handleCanvasDragOver,
    handleCanvasDragEnter,
    handleCanvasDragLeave,
    
    // Selection Operations
    selectAllSteps,
    clearSelection,
    toggleStepSelection,
    
    // Copy/Paste Operations
    copySteps,
    pasteSteps,
    duplicateSteps,
    
    // Mouse Event Handlers
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    
    // Selection Utilities
    getStepsInSelectionBox,
    handleStepClick,
    
    // Connection Operations
    startConnection,
    endConnection,
    removeConnection,
    
    // Snap Operations
    snapToPosition,
    clearSnapLines,
    toggleSnap,
    
    // Helper Functions
    getStepCenter,
    getConnectionStyle
  };
};

export default useCanvas;
