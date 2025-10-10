import { useState, useCallback, useRef, useEffect } from 'react';
import { TestStep } from '@/types';

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseCanvasSelectionReturn {
  // Selection state
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
  
  // Copied steps state
  copiedSteps: TestStep[];
  setCopiedSteps: (steps: TestStep[]) => void;
  
  // Selection operations
  selectAllSteps: (allSteps: TestStep[]) => void;
  clearSelection: () => void;
  toggleStepSelection: (stepId: string, ctrlKey?: boolean) => void;
  
  // Copy/Paste operations
  copySteps: (testSteps: TestStep[]) => void;
  pasteSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
  duplicateSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
  
  // Mouse event handlers
  handleCanvasMouseDown: (e: React.MouseEvent, canvasRef: React.RefObject<HTMLDivElement | null>, zoom: number, canvasOffset: { x: number; y: number }, isPanning: boolean, setIsPanning: (panning: boolean) => void, setPanStart: (start: { x: number; y: number }) => void, testSteps: TestStep[], selectedSteps: Set<string>, setSelectedSteps: (steps: Set<string>) => void, setSelectedStep: (step: TestStep | null) => void) => void;
  handleCanvasMouseMove: (e: MouseEvent, canvasRef: React.RefObject<HTMLDivElement | null>, zoom: number, canvasOffset: { x: number; y: number }, isPanning: boolean, panStart: { x: number; y: number }, setPan: (pan: { x: number; y: number }) => void, setCanvasOffset: (offset: { x: number; y: number }) => void, testSteps: TestStep[], setSelectedSteps: (steps: Set<string>) => void) => void;
  handleCanvasMouseUp: (e: MouseEvent, setIsPanning: (panning: boolean) => void) => void;
  
  // Selection utilities
  getStepsInSelectionBox: (testSteps: TestStep[], selectionBox: SelectionBox) => TestStep[];
  handleStepClick: (step: TestStep, ctrlKey: boolean, selectedSteps: Set<string>, setSelectedSteps: (steps: Set<string>) => void, setSelectedStep: (step: TestStep | null) => void) => void;
}

interface UseMouseEventsParams {
  selectionIsSelecting: boolean;
  isPanning: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  canvasOffset: { x: number; y: number };
  panStart: { x: number; y: number };
  testSteps: TestStep[];
  selectionHandleCanvasMouseMove: (
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
  ) => void;
  selectionHandleCanvasMouseUp: (
    e: MouseEvent,
    setIsPanning: (panning: boolean) => void
  ) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setIsPanning: (panning: boolean) => void;
}

const useCanvasSelection = (): UseCanvasSelectionReturn => {
  // Selection state
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  
  // Copied steps state
  const [copiedSteps, setCopiedSteps] = useState<TestStep[]>([]);

  // Selection operations
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
        // Multi-select with Ctrl
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
      } else {
        // Single select
        newSet.clear();
        newSet.add(stepId);
      }
      
      return newSet;
    });
  }, []);

  // Copy/Paste operations
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

    // Find the bounding box of copied steps
    const minX = Math.min(...copiedSteps.map(step => step.x));
    const minY = Math.min(...copiedSteps.map(step => step.y));

    // Offset for pasted steps
    const offsetX = 50;
    const offsetY = 50;

    const pastedSteps = copiedSteps.map(step => ({
      ...step,
      id: generateId(), // Generate new ID
      x: step.x - minX + offsetX, // Relative positioning
      y: step.y - minY + offsetY,
      // Clear connections for pasted steps to avoid conflicts
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...pastedSteps];
    onStepsChange(newSteps);
    
    // Select the newly pasted steps
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
      x: step.x + 50, // Offset by 50px
      y: step.y + 50,
      // Clear connections for duplicated steps
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...duplicatedSteps];
    onStepsChange(newSteps);
    
    // Select the newly duplicated steps
    const newStepIds = new Set(duplicatedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  }, [selectedSteps]);

  // Handle canvas mouse down
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

    // Convert to canvas coordinates
    const canvasX = (clientX - canvasOffset.x) / zoom;
    const canvasY = (clientY - canvasOffset.y) / zoom;

    // Check if clicking on a step
    const clickedStep = testSteps.find(step => {
      const stepLeft = step.x;
      const stepRight = step.x + 192; // 12rem = 192px
      const stepTop = step.y;
      const stepBottom = step.y + 80; // Approximate step height

      return canvasX >= stepLeft && canvasX <= stepRight && 
             canvasY >= stepTop && canvasY <= stepBottom;
    });

    if (clickedStep) {
      // Handle step click
      handleStepClick(clickedStep, e.ctrlKey, selectedSteps, setSelectedSteps, setSelectedStep);
    } else if (e.button === 0) { // Left mouse button
      if (e.ctrlKey || e.metaKey) {
        // Start selection box
        setIsSelecting(true);
        setSelectionStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
      } else {
        // Clear selection and start panning
        if (!isPanning) {
          setSelectedSteps(new Set());
          setSelectedStep(null);
        }
        
        // Start panning
        setIsPanning(true);
        setPanStart({ x: clientX, y: clientY });
      }
    }
  }, []);

  // Handle canvas mouse move
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
      // Handle panning - delegate to useCanvasInteraction
      // This will be handled by the main component
    } else if (isSelecting && selectionStart) {
      // Handle selection box
      const canvasX = (clientX - canvasOffset.x) / zoom;
      const canvasY = (clientY - canvasOffset.y) / zoom;

      const newSelectionBox = {
        x: Math.min(selectionStart.x, canvasX),
        y: Math.min(selectionStart.y, canvasY),
        width: Math.abs(canvasX - selectionStart.x),
        height: Math.abs(canvasY - selectionStart.y)
      };

      setSelectionBox(newSelectionBox);

      // Update selected steps based on selection box
      const stepsInBox = getStepsInSelectionBox(testSteps, newSelectionBox);
      setSelectedSteps(new Set(stepsInBox.map(step => step.id)));
    }
  }, [isSelecting, selectionStart]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback((
    e: MouseEvent,
    setIsPanning: (panning: boolean) => void
  ) => {
    // End panning
    setIsPanning(false);
    
    // End selection
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
    }
  }, [isSelecting]);

  // Get steps within selection box
  const getStepsInSelectionBox = useCallback((testSteps: TestStep[], box: SelectionBox) => {
    return testSteps.filter(step => {
      const stepCenterX = step.x + 96; // Center of step (192px / 2)
      const stepCenterY = step.y + 40; // Center of step (approximate)

      return stepCenterX >= box.x && 
             stepCenterX <= box.x + box.width &&
             stepCenterY >= box.y && 
             stepCenterY <= box.y + box.height;
    });
  }, []);

  // Handle step click
  const handleStepClick = useCallback((
    step: TestStep,
    ctrlKey: boolean,
    selectedSteps: Set<string>,
    setSelectedSteps: (steps: Set<string>) => void,
    setSelectedStep: (step: TestStep | null) => void
  ) => {
    if (ctrlKey) {
      // Multi-select mode
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
      // Single select mode
      setSelectedSteps(new Set([step.id]));
      setSelectedStep(step);
    }
  }, []);

  return {
    // Selection state
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
    
    // Copied steps state
    copiedSteps,
    setCopiedSteps,
    
    // Selection operations
    selectAllSteps,
    clearSelection,
    toggleStepSelection,
    
    // Copy/Paste operations
    copySteps,
    pasteSteps,
    duplicateSteps,
    
    // Mouse event handlers
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    
    // Selection utilities
    getStepsInSelectionBox,
    handleStepClick
  };
};

// Mouse events hook for global event handling
export const useMouseEvents = ({
  selectionIsSelecting,
  isPanning,
  canvasRef,
  zoom,
  canvasOffset,
  panStart,
  testSteps,
  selectionHandleCanvasMouseMove,
  selectionHandleCanvasMouseUp,
  setPan,
  setCanvasOffset,
  setSelectedSteps,
  setIsPanning
}: UseMouseEventsParams) => {
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
  }, [
    selectionIsSelecting,
    isPanning,
    canvasRef,
    zoom,
    canvasOffset,
    panStart,
    testSteps,
    selectionHandleCanvasMouseMove,
    selectionHandleCanvasMouseUp,
    setPan,
    setCanvasOffset,
    setSelectedSteps,
    setIsPanning
  ]);
};

export default useCanvasSelection;
