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
