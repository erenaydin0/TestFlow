'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button, ButtonGroup } from '@/components';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'ghost' | 'cosmic';
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  clearButtonText?: string;
  selectedText?: string;
  className?: string;
  style?: React.CSSProperties;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  actions,
  onClearSelection,
  clearButtonText = 'Temizle',
  selectedText = 'seçili',
  className,
  style
}) => {
  // Don't render if no items are selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border-primary)',
        ...style
      }}
    >
      {/* Selection Info */}
      <span style={{ 
        fontSize: '0.875rem', 
        color: 'var(--text-secondary)' 
      }}>
        {selectedCount} {selectedText}
      </span>
      
      {/* Clear Selection Button */}
      <Button
        variant="secondary"
        size="sm"
        icon={X}
        onClick={onClearSelection}
      >
        {clearButtonText}
      </Button>
      
      {/* Action Buttons */}
      <ButtonGroup spacing="sm">
        {actions.map(action => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            icon={action.icon as any}
            onClick={action.onClick}
            disabled={action.disabled}
            style={action.style}
          >
            {action.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default BulkActionsBar;
