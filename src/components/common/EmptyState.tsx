'use client';

import React from 'react';
import { Button } from '@/components';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'ghost' | 'cosmic';
    icon?: React.ReactNode;
  };
  className?: string;
  style?: React.CSSProperties;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  className,
  style
}) => {
  return (
    <div 
      className={className}
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        ...style
      }}
    >
      {/* Icon */}
      {icon && (
        <div style={{ 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      )}
      
      {/* Title */}
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: 500, 
        color: 'var(--text-primary)',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)',
          margin: '0 0 1.5rem 0',
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {actionButton && (
        <Button 
          onClick={actionButton.onClick}
          variant={actionButton.variant || 'cosmic'}
          icon={actionButton.icon as any}
          size="sm"
          style={{ margin: '0 auto' }}
        >
          {actionButton.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
