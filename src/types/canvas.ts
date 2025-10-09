import { TestStep } from './test';

// Canvas specific types
export interface DragPreview {
  x: number;
  y: number;
  stepId: string;
}

// Component Props
export interface TestStepCardProps {
  step: TestStep;
  isSelected: boolean;
  isMultiSelected: boolean;
  draggedStep: string | null;
  selectedStep: TestStep | null;
  selectedSteps: Set<string>;
  
  // Connection props
  isConnecting: boolean;
  connectionStart: string | null;
  connectionType: 'normal' | 'true' | 'false';
  
  // Event handlers
  onStepDragStart: (stepId: string) => void;
  onDragEnd: () => void;
  onStepClick: (step: TestStep, ctrlKey: boolean) => void;
  onDeleteStep: (stepId: string, callback: () => void) => void;
  onStartConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  onEndConnection: (stepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  
  // State setters
  setIsConnecting: (connecting: boolean) => void;
  setConnectionStart: (start: string | null) => void;
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
  testSteps: TestStep[];
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

export interface StepModalProps {
  isOpen: boolean;
  step: TestStep | null;
  onClose: () => void;
  onUpdateProperty: (stepId: string, property: string, value: any) => void;
}

export interface StepHeaderProps {
  step: TestStep;
  isSelected: boolean;
  onDelete: (stepId: string, callback: () => void) => void;
  onStartConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  isConnecting: boolean;
  connectionStart: string | null;
  connectionType: 'normal' | 'true' | 'false';
}

export interface StepContentProps {
  step: TestStep;
  onUpdateProperty: (stepId: string, property: string, value: any) => void;
}

export interface FloatingToolbarProps {
  onAutoArrange: () => void;
  testStepsCount: number;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDeleteSelected: () => void;
  selectedStepsCount: number;
  copiedStepsCount: number;
  isConnecting: boolean;
  connectionType: 'normal' | 'true' | 'false';
  onExport: () => void;
  onImport: (file: File) => void;
  onSave: () => void;
  onRun: () => void;
  isRunning: boolean;
  enableScreenshots: boolean;
  enableRecording: boolean;
  headlessMode: boolean;
  onToggleScreenshots: () => void;
  onToggleRecording: () => void;
  onToggleHeadless: () => void;
  selectedBrowser: string;
  onBrowserChange: (browser: string) => void;
}

export interface ActionsPanelProps {
  draggedAction: string | null;
  onActionDragStart: (action: string) => void;
  onDragEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  testStepsCount: number;
}

export interface ConnectionRendererProps {
  testSteps: TestStep[];
  getStepCenter: (stepId: string, testSteps: TestStep[]) => { x: number; y: number };
  getConnectionStyle: (start: { x: number; y: number }, end: { x: number; y: number }, type: 'normal' | 'true' | 'false') => any;
  removeConnection: (stepId: string, targetStepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

export interface DragPreviewProps {
  dragPreview: DragPreview;
  draggedStep: string | null;
  testSteps: TestStep[];
}

export interface BrowserSelectorProps {
  selectedBrowser: string;
  onBrowserChange: (browser: string) => void;
}

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaveDialogOpen: boolean;
}
