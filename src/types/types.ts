// ============================================================================
// BASE TYPES
// ============================================================================

// Base interface'ler - ortak özellikler için
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BaseFormData {
  name: string;
  description?: string;
}

export interface BaseTableProps<T = any> {
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export interface BaseFilterState {
  search: string;
}

export interface BaseHookOptions {
  autoLoad?: boolean;
  autoFetch?: boolean;
}

export interface BaseStats {
  total: number;
  completed: number;
  failed: number;
  successRate: number;
}

export interface BaseCellProps {
  value?: any;
  item?: any;
  index?: number;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

import { Test, TestFilters, TestFormData } from './test';
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
  history: any[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  saveToHistory: (steps: any[]) => void;
  undo: (callback?: () => void) => void;
  redo: (callback?: () => void) => void;
  addStep: (step: any) => void;
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

// ============================================================================
// UI TYPES
// ============================================================================

import { BrowserType, BrowserOption } from './browser';
import { ExecutionResult } from './execution';

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Status Types
export type TestStatus = 'passed' | 'failed' | 'pending' | 'running';
export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'passed' | 'failed';
export type ScheduleStatus = 'active' | 'paused' | 'disabled';
export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

// Modal Props
export interface TestModalProps extends BaseModalProps {
  onSave: (data: TestFormData) => void;
  initialData?: TestFormData;
  mode?: 'create' | 'edit' | 'save';
  isUpdating?: boolean;
  title?: string;
  description?: string;
}

export interface ConfirmDialogProps extends BaseModalProps {
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface SettingsModalProps extends BaseModalProps {
  // Settings modal specific props
}

// Table Props
export interface DataTableProps<T = any> extends BaseTableProps<T> {
  columns: Column<T>[];
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getItemId?: (item: T) => string;
  onRowClick?: (item: T) => void;
  allData?: T[];
  highlightedItemId?: string;
}

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

// Filter Props
export interface DataFiltersProps {
  filters: TestFilters | ExecutionFilters;
  onFiltersChange: (filters: TestFilters | ExecutionFilters) => void;
  availableOptions: {
    suites: string[];
    tags: string[];
    statuses?: string[];
    browsers: BrowserType[];
  };
  showDateRange?: boolean;
  showStatus?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

// Cell Props
export interface BrowserCellProps extends BaseCellProps {
  browserType?: BrowserType;
}

export interface TagsCellProps extends BaseCellProps {
  tags: string[];
  maxVisible?: number;
}

export interface StatusCellProps extends BaseCellProps {
  status: TestStatus | ExecutionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export interface TestNameCellProps extends BaseCellProps {
  name: string;
  description?: string;
  id: string;
}

export interface ActionsCellProps extends BaseCellProps {
  onRun?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  disabled?: boolean;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
  }>;
}

// Button Props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  loading?: boolean;
  children?: React.ReactNode;
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  tooltip?: string;
}

export interface ButtonGroupProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  className?: string;
}
