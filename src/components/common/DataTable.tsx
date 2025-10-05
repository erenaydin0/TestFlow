'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getItemId?: (item: T) => string;
  onRowClick?: (item: T) => void;
  onRowDoubleClick?: (item: T) => void;
  className?: string;
  allData?: T[]; // Tüm filtrelenmiş veriler için
  highlightedItemId?: string | null;
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Veri bulunamadı',
  onSort,
  sortField,
  sortOrder,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  getItemId = (item) => item.id,
  onRowClick,
  onRowDoubleClick,
  className = '',
  allData,
  highlightedItemId = null
}: DataTableProps<T>) => {
  const [internalSortField, setInternalSortField] = useState<string>('');
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentSortField = sortField || internalSortField;
  const currentSortOrder = sortOrder || internalSortOrder;

  const handleSort = (field: string) => {
    const column = columns.find(col => col.key === field);
    if (!column?.sortable) return;

    let newOrder: 'asc' | 'desc' = 'desc';
    if (currentSortField === field) {
      newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    }

    if (onSort) {
      onSort(field, newOrder);
    } else {
      setInternalSortField(field);
      setInternalSortOrder(newOrder);
    }
  };

  const getSortIcon = (field: string) => {
    if (currentSortField !== field) return <ArrowUpDown size={12} />;
    return currentSortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      // allData varsa tüm filtrelenmiş verileri seç, yoksa sadece mevcut sayfayı seç
      const dataToSelect = allData || data;
      const allIds = new Set(dataToSelect.map(getItemId));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleItemSelection = (itemId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange(newSelection);
  };

  const dataToCheck = allData || data;
  const isAllSelected = selectable && dataToCheck.length > 0 && selectedItems.size === dataToCheck.length;
  const isIndeterminate = selectable && selectedItems.size > 0 && selectedItems.size < dataToCheck.length;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '2rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid var(--border-primary)', 
          borderTop: '2px solid var(--text-primary)', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
        <span style={{ marginLeft: '0.5rem' }}>Yükleniyor...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '2rem',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem'
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`data-table ${className}`} style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        backgroundColor: 'var(--bg-primary)',
        tableLayout: 'fixed'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
            {selectable && (
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                width: '50px',
                minWidth: '50px',
                maxWidth: '50px',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ 
                    borderRadius: '0.25rem', 
                    border: '1px solid var(--border-primary)' 
                  }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '0.75rem',
                  textAlign: column.align || 'left',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: column.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: column.width,
                  ...(!column.sortable && { cursor: 'default' })
                }}
                onClick={() => column.sortable && handleSort(column.key)}
                className={column.className}
              >
                {column.sortable ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    justifyContent: column.align === 'center' ? 'center' : 
                                   column.align === 'right' ? 'flex-end' : 'flex-start'
                  }}>
                    {column.label}
                    {getSortIcon(column.key)}
                  </div>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const itemId = getItemId(item);
            const isSelected = selectedItems.has(itemId);
            const isHighlighted = highlightedItemId === itemId;
            
            return (
              <tr
                key={itemId}
                id={`item-${itemId}`}
                style={{
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: (onRowClick || onRowDoubleClick) ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: isHighlighted ? 'var(--bg-tertiary)' : 'transparent',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={(e) => {
                  // Checkbox, button veya input elementlerine tıklanırsa modal açma
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT' || 
                      target.tagName === 'BUTTON' ||
                      target.closest('button') ||
                      target.closest('input')) {
                    return;
                  }
                  onRowClick && onRowClick(item);
                }}
                onDoubleClick={(e) => {
                  // Checkbox, button veya input elementlerine çift tıklanırsa modal açma
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'INPUT' || 
                      target.tagName === 'BUTTON' ||
                      target.closest('button') ||
                      target.closest('input')) {
                    return;
                  }
                  onRowDoubleClick && onRowDoubleClick(item);
                }}
              >
                {selectable && (
                  <td style={{ 
                    padding: '0.75rem',
                    width: '50px',
                    minWidth: '50px',
                    maxWidth: '50px'
                  }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleItemSelection(itemId, e.target.checked);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ 
                        borderRadius: '0.25rem', 
                        border: '1px solid var(--border-primary)' 
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = item[column.key];
                  const cellContent = column.render 
                    ? column.render(value, item, index)
                    : value;

                  return (
                    <td
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        textAlign: column.align || 'left',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        width: column.width
                      }}
                      className={column.className}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
