'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type IconButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  tooltip?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  tooltip,
  disabled,
  className,
  style,
  onClick,
  ...props
}) => {
  const getVariantStyles = (variant: IconButtonVariant) => {
    const baseStyles = {
      border: 'none',
      borderRadius: '0.375rem',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled || loading ? 0.6 : 1,
      outline: 'none',
      position: 'relative' as const
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#2563eb',
          color: 'white'
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
          backgroundColor: '#059669',
          color: 'white'
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#dc2626',
          color: 'white'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#f59e0b',
          color: 'white'
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)'
        };
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = (size: IconButtonSize) => {
    switch (size) {
      case 'xs':
        return {
          padding: '0.25rem',
          width: '1.5rem',
          height: '1.5rem'
        };
      case 'sm':
        return {
          padding: '0.375rem',
          width: '2rem',
          height: '2rem'
        };
      case 'md':
        return {
          padding: '0.5rem',
          width: '2.5rem',
          height: '2.5rem'
        };
      case 'lg':
        return {
          padding: '0.75rem',
          width: '3rem',
          height: '3rem'
        };
      default:
        return {
          padding: '0.5rem',
          width: '2.5rem',
          height: '2.5rem'
        };
    }
  };

  const getIconSize = (size: IconButtonSize) => {
    switch (size) {
      case 'xs': return 12;
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 18;
      default: return 16;
    }
  };

  const getHoverStyles = (variant: IconButtonVariant) => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#1d4ed8' };
      case 'secondary':
        return { backgroundColor: 'var(--bg-tertiary)' };
      case 'success':
        return { backgroundColor: '#047857' };
      case 'danger':
        return { backgroundColor: '#b91c1c' };
      case 'warning':
        return { backgroundColor: '#d97706' };
      case 'ghost':
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
      title={tooltip}
    >
      {loading ? (
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
      ) : (
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

export default IconButton;
