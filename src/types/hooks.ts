import { BaseHookOptions } from './base';
import { Test, TestFilters, TestFormData } from './test';
import { ExecutionResult, ExecutionFilters, ExecutionStats } from './execution';

// Test Hooks
export interface UseTestsOptions extends BaseHookOptions {
  filters?: TestFilters;
}

export interface UseTestsReturn {
  tests: Test[];
  loading: boolean;
  error: string | null;
  filteredTests: Test[];
  filters: TestFilters;
  setFilters: (filters: TestFilters) => void;
  filterOptions: {
    suites: string[];
    tags: string[];
    browsers: string[];
  };
  refresh: () => void;
  deleteTest: (id: string) => boolean;
  duplicateTest: (id: string) => string | null;
  updateTest: (id: string, test: Test) => void;
  bulkDeleteTests: (ids: string[]) => number;
  bulkDuplicateTests: (ids: string[]) => number;
}

// Execution Hooks
export interface UseExecutionsOptions extends BaseHookOptions {
  filters?: ExecutionFilters;
}

export interface UseExecutionsReturn {
  executions: ExecutionResult[];
  loading: boolean;
  error: string | null;
  stats: ExecutionStats;
  refresh: () => void;
  deleteExecution: (id: string) => boolean;
  bulkDeleteExecutions: (ids: string[]) => number;
}

// Reports Hooks
export interface UseReportsOptions extends BaseHookOptions {
  filters?: ExecutionFilters;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseReportsReturn {
  executions: ExecutionResult[];
  filteredExecutions: ExecutionResult[];
  sortedExecutions: ExecutionResult[];
  loading: boolean;
  error: string | null;
  stats: ExecutionStats;
  filteredStats: ExecutionStats;
  filters: ExecutionFilters;
  setFilters: (filters: ExecutionFilters) => void;
  filterOptions: {
    suites: string[];
    tags: string[];
    statuses: string[];
    browsers: string[];
  };
  hasActiveFilters: boolean;
  clearFilters: () => void;
  refresh: () => void;
  deleteExecution: (id: string) => boolean;
  bulkDeleteExecutions: (ids: string[]) => number;
}

// Canvas Hooks
export interface UseCanvasInteractionReturn {
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasOffset: { x: number; y: number };
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  zoom: number;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (start: { x: number; y: number }) => void;
  draggedAction: string | null;
  setDraggedAction: (action: string | null) => void;
  draggedStep: string | null;
  setDraggedStep: (step: string | null) => void;
  setIsDragOver: (over: boolean) => void;
  dragPreview: any;
  setDragPreview: (preview: any) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  handleActionDragStart: (action: string) => void;
  handleStepDragStart: (stepId: string) => void;
  handleDragEnd: () => void;
  handleCanvasDragOver: (e: React.DragEvent, snapToPosition: any, testSteps: any[], setSnapLines: any) => void;
  handleCanvasDragEnter: (e: React.DragEvent, snapToPosition: any, testSteps: any[], setSnapLines: any) => void;
  handleCanvasDragLeave: (e: React.DragEvent, clearSnapLines: () => void) => void;
}

export interface UseSelectionReturn {
  isSelecting: boolean;
  selectionBox: any;
  handleCanvasMouseDown: (e: React.MouseEvent, canvasRef: any, zoom: number, canvasOffset: any, isPanning: boolean, setIsPanning: any, setPanStart: any, testSteps: any[], selectedSteps: Set<string>, setSelectedSteps: any, setSelectedStep: any) => void;
  handleCanvasMouseMove: (e: MouseEvent, canvasRef: any, zoom: number, canvasOffset: any, isPanning: boolean, panStart: any, setPan: any, setCanvasOffset: any, testSteps: any[], setSelectedSteps: any) => void;
  handleCanvasMouseUp: (e: MouseEvent, canvasRef: any, zoom: number, canvasOffset: any, isPanning: boolean, setPan: any, setCanvasOffset: any, setSelectedSteps: any, setIsPanning: any) => void;
  handleStepClick: (step: any, ctrlKey: boolean, selectedSteps: Set<string>, setSelectedSteps: any, setSelectedStep: any) => void;
}

export interface UseCopyPasteReturn {
  selectedSteps: Set<string>;
  setSelectedSteps: (steps: Set<string>) => void;
  selectedStep: any;
  setSelectedStep: (step: any) => void;
  copiedSteps: any[];
  selectAllSteps: () => void;
  clearSelection: () => void;
  copySteps: (steps: any[]) => void;
  pasteSteps: (steps: any[], generateId: () => string, callback: (newSteps: any[]) => void) => void;
  duplicateSteps: (steps: any[], generateId: () => string, callback: (newSteps: any[]) => void) => void;
}

export interface UseSnapToGridReturn {
  snapEnabled: boolean;
  snapLines: any[];
  setSnapLines: (lines: any[]) => void;
  snapToPosition: (x: number, y: number, testSteps: any[], excludeStep?: string) => { x: number; y: number };
  clearSnapLines: () => void;
  toggleSnap: () => void;
}

export interface UseConnectionsReturn {
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;
  connectionStart: string | null;
  setConnectionStart: (start: string | null) => void;
  connectionType: 'normal' | 'true' | 'false';
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  startConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  endConnection: (stepId: string, testSteps: any[], setTestSteps: any, saveToHistory: any) => void;
  removeConnection: (stepId: string, targetStepId: string, testSteps: any[], setTestSteps: any, saveToHistory: any) => void;
  getStepCenter: (stepId: string, testSteps: any[]) => { x: number; y: number };
  getConnectionStyle: (start: { x: number; y: number }, end: { x: number; y: number }, type: 'normal' | 'true' | 'false') => any;
}

export interface UseTestStepsReturn {
  testSteps: any[];
  setTestSteps: (steps: any[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  saveToHistory: (steps: any[]) => void;
  undo: (callback?: () => void) => void;
  redo: (callback?: () => void) => void;
  deleteStep: (stepId: string, callback?: () => void) => void;
  updateStepProperty: (stepId: string, property: string, value: any) => void;
  autoArrangeSteps: () => void;
  generateId: () => string;
}

export interface UseUnsavedChangesProps {
  testSteps: any[];
  onSave: () => Promise<void>;
}

export interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  showUnsavedDialog: boolean;
  pendingNavigation: string | null;
  handleNavigation: (path: string) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  saveAndNavigate: () => void;
  markAsSaved: () => void;
  resetUnsavedChanges: () => void;
}
