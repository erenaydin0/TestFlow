'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  style,
  onClick,
  ...props
}) => {
  const getVariantStyles = (variant: ButtonVariant) => {
    const baseStyles = {
      border: 'none',
      borderRadius: '0.375rem',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: '500',
      opacity: disabled || loading ? 0.6 : 1,
      textDecoration: 'none',
      outline: 'none',
      position: 'relative' as const
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: 'var(--status-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--accent-primary)'
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'var(--status-success)',
          color: 'white',
          border: '1px solid var(--status-success)'
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: 'var(--status-error)',
          color: 'white',
          border: '1px solid var(--status-error)'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: 'var(--status-warning)',
          color: 'white',
          border: '1px solid var(--status-warning)'
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: 'none'
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        };
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = (size: ButtonSize) => {
    switch (size) {
      case 'xs':
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          gap: '0.25rem'
        };
      case 'sm':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
          gap: '0.375rem'
        };
      case 'md':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          gap: '0.5rem'
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          gap: '0.5rem'
        };
      default:
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          gap: '0.5rem'
        };
    }
  };

  const getIconSize = (size: ButtonSize) => {
    switch (size) {
      case 'xs': return 12;
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 18;
      default: return 16;
    }
  };

  const getHoverStyles = (variant: ButtonVariant) => {
    switch (variant) {
      case 'primary':
        return { 
          backgroundColor: 'var(--status-primary-hover)',
          boxShadow: '0 4px 12px var(--status-primary-bg)'
        };
      case 'secondary':
        return { backgroundColor: 'var(--bg-tertiary)' };
      case 'success':
        return { 
          backgroundColor: 'var(--status-success-hover)',
          boxShadow: '0 4px 12px var(--status-success-bg)'
        };
      case 'danger':
        return { 
          backgroundColor: 'var(--status-error-hover)',
          boxShadow: '0 4px 12px var(--status-error-bg)'
        };
      case 'warning':
        return { 
          backgroundColor: 'var(--status-warning-hover)',
          boxShadow: '0 4px 12px var(--status-warning-bg)'
        };
      case 'ghost':
        return { backgroundColor: 'var(--bg-tertiary)' };
      case 'outline':
        return { backgroundColor: 'var(--bg-tertiary)' };
      default:
        return {};
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const hoverStyles = getHoverStyles(variant);
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const variantStyles = getVariantStyles(variant) as any;
    e.currentTarget.style.backgroundColor = variantStyles.backgroundColor || 'transparent';
  };

  const buttonStyles = {
    ...getVariantStyles(variant),
    ...getSizeStyles(size),
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const iconSize = getIconSize(size);

  return (
    <button
      {...props}
      style={buttonStyles}
      className={className}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <div
          style={{
            width: iconSize,
            height: iconSize,
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={iconSize} />
      )}
      
      {children && (
        <span>{children}</span>
      )}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSize} />
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
