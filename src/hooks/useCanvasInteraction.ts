import { useState, useCallback, useRef } from 'react';
import { TestStep } from '@/types';

interface DragPreview {
  x: number;
  y: number;
  type: string;
}

interface UseCanvasInteractionReturn {
  // Canvas state
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
  
  // Drag state
  draggedAction: string | null;
  setDraggedAction: (action: string | null) => void;
  draggedStep: string | null;
  setDraggedStep: (step: string | null) => void;
  isDragOver: boolean;
  setIsDragOver: (dragOver: boolean) => void;
  dragPreview: DragPreview | null;
  setDragPreview: (preview: DragPreview | null) => void;
  
  // Selection box state
  isSelecting: boolean;
  setIsSelecting: (selecting: boolean) => void;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  
  // Zoom operations
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  
  // Drag handlers
  handleActionDragStart: (actionType: string) => void;
  handleStepDragStart: (stepId: string) => void;
  handleDragEnd: () => void;
  
  // Canvas event handlers
  handleCanvasDragOver: (e: React.DragEvent, snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any, testSteps: TestStep[], setSnapLines: (lines: any) => void) => void;
  handleCanvasDragEnter: (e: React.DragEvent, snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any, testSteps: TestStep[], setSnapLines: (lines: any) => void) => void;
  handleCanvasDragLeave: (e: React.DragEvent, clearSnapLines: () => void) => void;
}

const useCanvasInteraction = (): UseCanvasInteractionReturn => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Drag state
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  
  // Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Zoom operations
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

  // Drag handlers
  const handleActionDragStart = useCallback((actionType: string) => {
    setDraggedAction(actionType);
    setDraggedStep(null); // Clear any existing step drag
  }, []);

  const handleStepDragStart = useCallback((stepId: string) => {
    setDraggedStep(stepId);
    setDraggedAction(null); // Clear any existing action drag
  }, []);

  const handleDragEnd = useCallback(() => {
    // Clean up drag states if drag was cancelled
    setTimeout(() => {
      setDraggedAction(null);
      setDraggedStep(null);
      setDragPreview(null);
      setIsDragOver(false);
    }, 100);
  }, []);

  // Canvas event handlers
  const handleCanvasDragOver = useCallback((
    e: React.DragEvent,
    snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => any,
    testSteps: TestStep[],
    setSnapLines: (lines: any) => void
  ) => {
    e.preventDefault();
    // Allow drop
    e.dataTransfer.dropEffect = draggedAction ? 'copy' : 'move';
    setIsDragOver(true);
    
    // Update preview position with snap
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const centeredX = rawX - 96;
      const centeredY = rawY - 40;
      
      const snapped = snapToPosition(centeredX, centeredY, testSteps, draggedStep || undefined);
      
      setSnapLines(snapped.snapLines); // Update snap lines for visual feedback
      
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
    
    // Initialize preview on drag enter with snap
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
    // Only set to false if we're leaving the canvas completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragPreview(null);
      clearSnapLines(); // Clear snap lines
    }
  }, []);

  return {
    // Canvas state
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
    
    // Drag state
    draggedAction,
    setDraggedAction,
    draggedStep,
    setDraggedStep,
    isDragOver,
    setIsDragOver,
    dragPreview,
    setDragPreview,
    
    // Selection box state
    isSelecting,
    setIsSelecting,
    selectionBox,
    setSelectionBox,
    
    // Zoom operations
    zoomIn,
    zoomOut,
    resetView,
    
    // Drag handlers
    handleActionDragStart,
    handleStepDragStart,
    handleDragEnd,
    
    // Canvas event handlers
    handleCanvasDragOver,
    handleCanvasDragEnter,
    handleCanvasDragLeave
  };
};

export default useCanvasInteraction; 