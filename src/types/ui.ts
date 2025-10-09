import { BaseModalProps, BaseTableProps, BaseCellProps } from './base';
import { Test, TestFormData, TestFilters } from './test';
import { ExecutionResult, ExecutionFilters } from './execution';
import { BrowserType } from './test';

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

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
  status: 'passed' | 'failed' | 'running' | 'pending' | 'completed' | 'cancelled' | 'queued';
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
