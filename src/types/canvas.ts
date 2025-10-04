import { TestStep } from './test';

// Canvas specific types
export interface CanvasStyles {
  canvasContainer: React.CSSProperties;
  innerContainer: React.CSSProperties;
  svgLayer: React.CSSProperties;
}

export interface CanvasStylesParams {
  zoom: number;
  pan: { x: number; y: number };
  canvasOffset: { x: number; y: number };
  isPanning: boolean;
}

export interface SnapLines {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
  snapLines: SnapLines[];
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export interface ConnectionLineProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  type: 'normal' | 'true' | 'false';
  onRemove: () => void;
}

export interface SnapLinesProps {
  snapEnabled: boolean;
  snapLines: SnapLines[];
}

export interface SelectionBoxProps {
  selectionBox: SelectionBox;
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
