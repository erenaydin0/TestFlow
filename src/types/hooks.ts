import { BaseHookOptions } from './base';
import { Test, TestFilters } from './test';
import { ExecutionFilters } from './execution';

// Test Hooks
export interface UseTestsOptions extends BaseHookOptions {
  filters?: TestFilters;
}

// Execution Hooks
export interface UseExecutionsOptions extends BaseHookOptions {
  filters?: ExecutionFilters;
}

// Reports Hooks
export interface UseReportsOptions extends BaseHookOptions {
  filters?: ExecutionFilters;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
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
