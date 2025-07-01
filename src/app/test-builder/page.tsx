'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  MousePointer, 
  Type, 
  Navigation, 
  Clock, 
  RefreshCw, 
  GitBranch,
  Trash2,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { TestStep } from '@/types';
import FloatingToolbar from '@/components/test-builder/FloatingToolbar';
import ActionsPanel from '@/components/test-builder/ActionsPanel';
import CanvasControls from '@/components/test-builder/CanvasControls';
import StepModal from '@/components/test-builder/StepModal';

// Available actions
const availableActions = [
  {
    type: 'navigate',
    title: 'Sayfa Git',
    icon: Navigation,
    color: '#2563eb',
    description: 'Belirtilen URL\'e git'
  },
  {
    type: 'click',
    title: 'Tıkla',
    icon: MousePointer,
    color: '#059669',
    description: 'Element\'e tıkla'
  },
  {
    type: 'input',
    title: 'Metin Gir',
    icon: Type,
    color: '#dc2626',
    description: 'Input alanına metin gir'
  },
  {
    type: 'wait',
    title: 'Bekle',
    icon: Clock,
    color: '#d97706',
    description: 'Belirtilen süre bekle'
  },
  {
    type: 'refresh',
    title: 'Yenile',
    icon: RefreshCw,
    color: '#7c3aed',
    description: 'Sayfayı yenile'
  },
  {
    type: 'if',
    title: 'Koşul',
    icon: GitBranch,
    color: '#db2777',
    description: 'Koşullu işlem'
  }
];

export default function TestBuilder() {
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<{x: number, y: number, type: string} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'normal' | 'true' | 'false'>('normal');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<{x: number[], y: number[]}>({x: [], y: []});
  const [copiedSteps, setCopiedSteps] = useState<TestStep[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [history, setHistory] = useState<TestStep[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // History management
  const saveToHistory = (newSteps: TestStep[]) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newSteps]);
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTestSteps([...history[newIndex]]);
      setSelectedSteps(new Set());
      setSelectedStep(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTestSteps([...history[newIndex]]);
      setSelectedSteps(new Set());
      setSelectedStep(null);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Snap to grid and other steps
  const snapToPosition = (x: number, y: number, excludeStepId?: string) => {
    if (!snapEnabled) return { x, y, snapLines: { x: [], y: [] } };

    const SNAP_THRESHOLD = 15; // pixels
    const GRID_SIZE = 20; // Grid snap size
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
      const stepCenterX = step.x + 96; // Step width/2
      const stepCenterY = step.y + 40; // Step height/2
      const stepLeft = step.x;
      const stepRight = step.x + 192; // Step width
      const stepTop = step.y;
      const stepBottom = step.y + 80; // Step height

      // Horizontal alignment (Y-axis)
      if (Math.abs(y - step.y) < SNAP_THRESHOLD) {
        snappedY = step.y; // Top alignment
        activeSnapLines.y.push(step.y);
      } else if (Math.abs(y - stepCenterY) < SNAP_THRESHOLD) {
        snappedY = stepCenterY - 40; // Center alignment
        activeSnapLines.y.push(stepCenterY);
      } else if (Math.abs(y - stepBottom) < SNAP_THRESHOLD) {
        snappedY = stepBottom; // Bottom alignment
        activeSnapLines.y.push(stepBottom);
      }

      // Vertical alignment (X-axis)  
      if (Math.abs(x - step.x) < SNAP_THRESHOLD) {
        snappedX = step.x; // Left alignment
        activeSnapLines.x.push(step.x);
      } else if (Math.abs(x - stepCenterX) < SNAP_THRESHOLD) {
        snappedX = stepCenterX - 96; // Center alignment
        activeSnapLines.x.push(stepCenterX);
      } else if (Math.abs(x - stepRight) < SNAP_THRESHOLD) {
        snappedX = stepRight; // Right alignment
        activeSnapLines.x.push(stepRight);
      }

      // Spacing alignment (common distances)
      const COMMON_SPACING = [50, 100, 150, 200, 250]; // Common spacing values
      for (const spacing of COMMON_SPACING) {
        // Horizontal spacing
        if (Math.abs(x - (stepRight + spacing)) < SNAP_THRESHOLD) {
          snappedX = stepRight + spacing;
          activeSnapLines.x.push(stepRight + spacing);
        }
        if (Math.abs(x - (stepLeft - spacing - 192)) < SNAP_THRESHOLD) {
          snappedX = stepLeft - spacing - 192;
          activeSnapLines.x.push(stepLeft - spacing);
        }

        // Vertical spacing
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
  };

  // Handle drag start for actions
  const handleActionDragStart = (actionType: string) => {
    setDraggedAction(actionType);
    setDraggedStep(null); // Clear any existing step drag
  };

  // Handle drag start for existing steps
  const handleStepDragStart = (stepId: string) => {
    setDraggedStep(stepId);
    setDraggedAction(null); // Clear any existing action drag
  };

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
      const action = availableActions.find(a => a.type === draggedAction);
      if (action) {
        const snapped = snapToPosition(centeredX, centeredY);
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
      const snapped = snapToPosition(centeredX, centeredY, draggedStep);
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
    setSnapLines({ x: [], y: [] }); // Clear snap lines
  }, [draggedAction, draggedStep, canvasOffset, zoom, snapToPosition]);

  // Handle canvas drag over
  const handleCanvasDragOver = (e: React.DragEvent) => {
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
      
      const snapped = snapToPosition(centeredX, centeredY, draggedStep || undefined);
      
      setSnapLines(snapped.snapLines); // Update snap lines for visual feedback
      
      if (draggedAction) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: 'step' });
      }
    }
  };

  // Handle drag enter
  const handleCanvasDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // Initialize preview on drag enter with snap
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const centeredX = rawX - 96;
      const centeredY = rawY - 40;
      
      const snapped = snapToPosition(centeredX, centeredY, draggedStep || undefined);
      
      setSnapLines(snapped.snapLines);
      
      if (draggedAction) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: snapped.x, y: snapped.y, type: 'step' });
      }
    }
  };

  // Handle drag leave
  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the canvas completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragPreview(null);
      setSnapLines({ x: [], y: [] }); // Clear snap lines
    }
  };

  // Handle drag end (cleanup if drag is cancelled)
  const handleDragEnd = (e: React.DragEvent) => {
    // Clean up drag states if drag was cancelled
    setTimeout(() => {
      setDraggedAction(null);
      setDraggedStep(null);
      setDragPreview(null);
      setIsDragOver(false);
    }, 100);
  };

  // Delete step
  const deleteStep = (stepId: string) => {
    const newSteps = testSteps.filter(step => step.id !== stepId);
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    setSelectedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep(null);
    }
  };

  // Copy/Paste functions
  const copySteps = () => {
    if (selectedSteps.size === 0) return;
    
    const stepsToCopy = testSteps.filter(step => selectedSteps.has(step.id));
    setCopiedSteps(stepsToCopy);
  };

  const pasteSteps = () => {
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
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    
    // Select the newly pasted steps
    const newStepIds = new Set(pastedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  };

  const duplicateSteps = () => {
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
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    
    // Select the newly duplicated steps
    const newStepIds = new Set(duplicatedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  };

  const deleteSelectedSteps = () => {
    if (selectedSteps.size === 0) return;
    
    const newSteps = testSteps.filter(step => !selectedSteps.has(step.id));
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    setSelectedSteps(new Set());
    
    if (selectedStep && selectedSteps.has(selectedStep.id)) {
      setSelectedStep(null);
    }
  };

  const selectAllSteps = () => {
    const allStepIds = new Set(testSteps.map(step => step.id));
    setSelectedSteps(allStepIds);
  };

  const clearSelection = () => {
    setSelectedSteps(new Set());
  };

  const toggleStepSelection = (stepId: string, ctrlKey: boolean = false) => {
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
            copySteps();
            break;
          case 'v':
            e.preventDefault();
            pasteSteps();
            break;
          case 'd':
            e.preventDefault();
            duplicateSteps();
            break;
          case 'a':
            e.preventDefault();
            selectAllSteps();
            break;
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
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

  // Canvas pan and click handling
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Check if we're clicking on a step element
    const target = e.target as HTMLElement;
    const isClickingOnStep = target.closest('[data-step-id]');
    
    // If clicking on canvas background (not on a step), handle selection/deselection
    if (e.target === e.currentTarget) {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedStep(null);
        setSelectedSteps(new Set());
      }
      
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionType('normal');
      }
    }
    
    // Don't start panning/selecting if we're clicking on a step or there's an active drag
    if (isClickingOnStep || draggedStep || draggedAction) {
      return;
    }
    
    if (e.button !== 0) return; // Only left click
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffsetX = canvasOffset.x;
    const startOffsetY = canvasOffset.y;
    let hasMoved = false;
    let isSelectionDrag = false;

    // Calculate canvas position for selection box
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvasStartX = (startX - rect.left - canvasOffset.x) / zoom;
    const canvasStartY = (startY - rect.top - canvasOffset.y) / zoom;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // If mouse moved more than a few pixels, it's a drag
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }
      
      // Determine if this should be selection or panning
      if (hasMoved && !isSelectionDrag) {
        // If Shift is held, start selection; otherwise pan
        isSelectionDrag = e.shiftKey;
        if (isSelectionDrag) {
          setIsSelecting(true);
        }
      }
      
      if (isSelectionDrag) {
        // Update selection box
        const currentCanvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
        const currentCanvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;
        
        setSelectionBox({
          x: Math.min(canvasStartX, currentCanvasX),
          y: Math.min(canvasStartY, currentCanvasY),
          width: Math.abs(currentCanvasX - canvasStartX),
          height: Math.abs(currentCanvasY - canvasStartY)
        });
        
        // Select steps within selection box
        const selectedIds = new Set<string>();
        testSteps.forEach(step => {
          const stepRight = step.x + 192; // 12rem
          const stepBottom = step.y + 80; // approximate height
          
          if (selectionBox && 
              step.x < selectionBox.x + selectionBox.width &&
              stepRight > selectionBox.x &&
              step.y < selectionBox.y + selectionBox.height &&
              stepBottom > selectionBox.y) {
            selectedIds.add(step.id);
          }
        });
        setSelectedSteps(selectedIds);
      } else {
        // Pan canvas
        setCanvasOffset({
          x: startOffsetX + deltaX,
          y: startOffsetY + deltaY
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsSelecting(false);
      setSelectionBox(null);
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleStepClick = (step: TestStep, ctrlKey: boolean = false) => {
    // Handle multi-selection
    toggleStepSelection(step.id, ctrlKey);
    
    // Open modal only for single selection
    if (!ctrlKey) {
      setSelectedStep(step);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStep(null);
  };

  const updateStepProperty = (stepId: string, property: string, value: any) => {
    const updatedSteps = testSteps.map(step => 
      step.id === stepId 
        ? { ...step, [property]: value }
        : step
    );
    setTestSteps(updatedSteps);
    saveToHistory(updatedSteps);
    
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep({ ...selectedStep, [property]: value });
    }
  };

  // Connection handling
  const startConnection = (stepId: string, type: 'normal' | 'true' | 'false' = 'normal') => {
    setIsConnecting(true);
    setConnectionStart(stepId);
    setConnectionType(type);
  };

  const endConnection = (stepId: string) => {
    if (connectionStart && connectionStart !== stepId) {
      const sourceStep = testSteps.find(s => s.id === connectionStart);
      
      if (sourceStep?.type === 'if' && connectionType !== 'normal') {
        // Handle If step connections
        const newSteps = testSteps.map(step => 
          step.id === connectionStart 
            ? { 
                ...step, 
                [connectionType === 'true' ? 'trueConnection' : 'falseConnection']: stepId
              }
            : step
        );
        setTestSteps(newSteps);
        saveToHistory(newSteps);
      } else {
        // Handle normal connections
        const newSteps = testSteps.map(step => 
          step.id === connectionStart 
            ? { 
                ...step, 
                connections: step.connections 
                  ? [...step.connections.filter(id => id !== stepId), stepId]
                  : [stepId]
              }
            : step
        );
        setTestSteps(newSteps);
        saveToHistory(newSteps);
      }
    }
    setIsConnecting(false);
    setConnectionStart(null);
    setConnectionType('normal');
  };

  const removeConnection = (fromStepId: string, toStepId: string, type: 'normal' | 'true' | 'false' = 'normal') => {
    const newSteps = testSteps.map(step => 
      step.id === fromStepId 
        ? { 
            ...step, 
            ...(type === 'true' ? { trueConnection: undefined } : 
                type === 'false' ? { falseConnection: undefined } : 
                { connections: step.connections?.filter(id => id !== toStepId) || [] })
          }
        : step
    );
    setTestSteps(newSteps);
    saveToHistory(newSteps);
  };

  // Get step center coordinates
  const getStepCenter = (step: TestStep) => {
    return {
      x: step.x + 96, // 12rem / 2 = 96px
      y: step.y + 40  // Approximate center height
    };
  };

  // Auto-arrange steps
  const autoArrangeSteps = () => {
    if (testSteps.length === 0) return;

    // Find steps with no incoming connections (start nodes)
    const startSteps = testSteps.filter(step => 
      !testSteps.some(otherStep => 
        otherStep.connections?.includes(step.id) ||
        otherStep.trueConnection === step.id ||
        otherStep.falseConnection === step.id
      )
    );

    // If no start steps found, use the first step
    if (startSteps.length === 0) {
      startSteps.push(testSteps[0]);
    }

    const arranged: Set<string> = new Set();
    const newPositions: { [key: string]: { x: number, y: number } } = {};
    const STEP_WIDTH = 250; // 12rem + margin
    const START_Y = 100; // Fixed Y position for horizontal line
    let currentColumn = 0;

    // Recursive function to arrange connected steps horizontally
    const arrangeFromStep = (stepId: string, column: number): number => {
      if (arranged.has(stepId)) return column;

      arranged.add(stepId);
      newPositions[stepId] = {
        x: column * STEP_WIDTH + 50, // 50px margin from left
        y: START_Y // Fixed Y position - horizontal line
      };

      const step = testSteps.find(s => s.id === stepId);
      if (!step) return column + 1;

      let nextColumn = column + 1;
      
      // Handle regular connections
      if (step.connections && step.connections.length > 0) {
        step.connections.forEach(connectedId => {
          if (!arranged.has(connectedId)) {
            nextColumn = arrangeFromStep(connectedId, nextColumn);
          }
        });
      }
      
      // Handle If step true connection
      if (step.trueConnection && !arranged.has(step.trueConnection)) {
        nextColumn = arrangeFromStep(step.trueConnection, nextColumn);
      }
      
      // Handle If step false connection
      if (step.falseConnection && !arranged.has(step.falseConnection)) {
        nextColumn = arrangeFromStep(step.falseConnection, nextColumn);
      }

      return nextColumn;
    };

    // Arrange the first start step horizontally
    if (startSteps.length > 0) {
      currentColumn = arrangeFromStep(startSteps[0].id, 0);
    }

    // Arrange any remaining unconnected steps in a horizontal line
    testSteps.forEach(step => {
      if (!arranged.has(step.id)) {
        newPositions[step.id] = {
          x: currentColumn * STEP_WIDTH + 50,
          y: START_Y
        };
        currentColumn++;
      }
    });

    // Update step positions
    const newSteps = testSteps.map(step => ({
      ...step,
      x: newPositions[step.id]?.x ?? step.x,
      y: newPositions[step.id]?.y ?? step.y
    }));
    setTestSteps(newSteps);
    saveToHistory(newSteps);

    // Reset canvas position to show arranged steps
    setCanvasOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Render connection lines
  const renderConnections = () => {
    const connections: React.ReactElement[] = [];
    
    const renderConnection = (fromStep: TestStep, toStepId: string, connectionType: 'normal' | 'true' | 'false') => {
      const toStep = testSteps.find(s => s.id === toStepId);
      if (!toStep) return;
      
      const fromCenter = getStepCenter(fromStep);
      const toCenter = getStepCenter(toStep);
      
      // Calculate arrow path
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Adjust start and end points to step edges
      const stepRadius = 60; // Approximate step radius
      const adjustedStart = {
        x: fromCenter.x + (dx / distance) * stepRadius,
        y: fromCenter.y + (dy / distance) * stepRadius
      };
      const adjustedEnd = {
        x: toCenter.x - (dx / distance) * stepRadius,
        y: toCenter.y - (dy / distance) * stepRadius
      };
      
      // Set colors based on connection type
      const colors = {
        normal: 'var(--border-primary)',
        true: '#22c55e', // Green for true branch
        false: '#ef4444' // Red for false branch
      };
      
      const color = colors[connectionType];
      
      connections.push(
        <g key={`${fromStep.id}-${toStep.id}-${connectionType}`}>
          {/* Connection line */}
          <line
            x1={adjustedStart.x}
            y1={adjustedStart.y}
            x2={adjustedEnd.x}
            y2={adjustedEnd.y}
            stroke={color}
            strokeWidth="2"
            strokeDasharray={connectionType === 'normal' ? "5,5" : "none"}
            opacity="0.8"
          />
          {/* Arrow head */}
          <polygon
            points={`${adjustedEnd.x},${adjustedEnd.y} ${adjustedEnd.x - 8 - (dx/distance)*8},${adjustedEnd.y - 4 - (dy/distance)*4} ${adjustedEnd.x - 8 - (dx/distance)*8},${adjustedEnd.y + 4 - (dy/distance)*4}`}
            fill={color}
            opacity="0.8"
          />
          {/* Connection type label for If branches */}
          {connectionType !== 'normal' && (
            <text
              x={(adjustedStart.x + adjustedEnd.x) / 2}
              y={(adjustedStart.y + adjustedEnd.y) / 2 - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              style={{ 
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {connectionType === 'true' ? 'TRUE' : 'FALSE'}
            </text>
          )}
        </g>
      );
    };
    
    testSteps.forEach(fromStep => {
      // Regular connections
      if (fromStep.connections) {
        fromStep.connections.forEach(toStepId => {
          renderConnection(fromStep, toStepId, 'normal');
        });
      }
      
      // If step true connection
      if (fromStep.trueConnection) {
        renderConnection(fromStep, fromStep.trueConnection, 'true');
      }
      
      // If step false connection
      if (fromStep.falseConnection) {
        renderConnection(fromStep, fromStep.falseConnection, 'false');
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
            onZoomIn={() => setZoom(Math.min(zoom + 0.1, 2))}
            onZoomOut={() => setZoom(Math.max(zoom - 0.1, 0.3))}
            onResetView={() => {
              setZoom(1);
              setCanvasOffset({ x: 0, y: 0 });
            }}
            testStepsCount={testSteps.length}
          />

          {/* Floating Toolbar */}
          <FloatingToolbar
            onAutoArrange={autoArrangeSteps}
            testStepsCount={testSteps.length}
            snapEnabled={snapEnabled}
            onToggleSnap={() => setSnapEnabled(!snapEnabled)}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onCopy={copySteps}
            onPaste={pasteSteps}
            onDuplicate={duplicateSteps}
            onDeleteSelected={deleteSelectedSteps}
            selectedStepsCount={selectedSteps.size}
            copiedStepsCount={copiedSteps.length}
            isConnecting={isConnecting}
            connectionType={connectionType}
          />

          {/* Floating Actions Panel */}
          <ActionsPanel
            availableActions={availableActions}
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
            onDragOver={handleCanvasDragOver}
            onDragEnter={handleCanvasDragEnter}
            onDragLeave={handleCanvasDragLeave}
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
              </svg>
              {/* Render drag preview */}
              {dragPreview && (() => {
                // Get the step being dragged or the action being added
                const draggedStepData = draggedStep ? testSteps.find(s => s.id === draggedStep) : null;
                const action = draggedStepData 
                  ? availableActions.find(a => a.type === draggedStepData.type)
                  : availableActions.find(a => a.type === dragPreview.type);
                
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
                const action = availableActions.find(a => a.type === step.type);
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
                          {availableActions.find(a => a.type === step.type)?.title || step.type}
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
                                  endConnection(step.id);
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
                                  endConnection(step.id);
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
                                endConnection(step.id);
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
                            deleteStep(step.id);
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

              {/* Selection Box */}
              {selectionBox && (
                <div
                  style={{
                    position: 'absolute',
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.width,
                    height: selectionBox.height,
                    border: '2px dashed #3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 999
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Modal */}
      <StepModal
        isOpen={isModalOpen}
        step={selectedStep}
        availableActions={availableActions}
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