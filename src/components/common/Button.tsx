'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'cosmic';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonGroupSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  children?: React.ReactNode;
  tooltip?: string;
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  tooltip?: string;
}

interface ButtonGroupProps {
  children: React.ReactNode;
  spacing?: ButtonGroupSpacing;
  className?: string;
  style?: React.CSSProperties;
}

// Shared utility functions
const getVariantStyles = (variant: ButtonVariant, isIconButton = false) => {
  const baseStyles: any = {
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    outline: 'none',
    position: 'relative' as const
  };

  // Add gap for regular buttons, not icon buttons
  if (!isIconButton) {
    baseStyles.gap = '0.5rem';
    baseStyles.fontWeight = '500';
    baseStyles.textDecoration = 'none';
  }

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: 'var(--status-primary)',
        color: isIconButton ? 'white' : 'var(--text-primary)',
        border: isIconButton ? 'none' : '1px solid var(--accent-primary)'
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
        color: isIconButton ? 'var(--text-primary)' : 'white',
        border: isIconButton ? 'none' : '1px solid var(--status-success)'
      };
    case 'danger':
      return {
        ...baseStyles,
        backgroundColor: 'var(--status-error)',
        color: isIconButton ? 'var(--text-primary)' : 'white',
        border: isIconButton ? 'none' : '1px solid var(--status-error)'
      };
    case 'warning':
      return {
        ...baseStyles,
        backgroundColor: 'var(--status-warning)',
        color: isIconButton ? 'var(--text-primary)' : 'white',
        border: isIconButton ? 'none' : '1px solid var(--status-warning)'
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
    case 'cosmic':
      return {
        ...baseStyles,
        backgroundColor: 'transparent', // CSS class'ında tanımlı
        color: 'white',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        fontWeight: '600'
      };
    default:
      return baseStyles;
  }
};

const getSizeStyles = (size: ButtonSize, isIconButton = false) => {
  if (isIconButton) {
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
  } else {
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

const getHoverStyles = (variant: ButtonVariant, isIconButton = false) => {
  switch (variant) {
    case 'primary':
      return { 
        backgroundColor: 'var(--status-primary-hover)',
        ...(isIconButton ? {} : { boxShadow: '0 4px 12px var(--status-primary-bg)' })
      };
    case 'secondary':
      return { backgroundColor: 'var(--bg-tertiary)' };
    case 'success':
      return { 
        backgroundColor: 'var(--status-success-hover)',
        ...(isIconButton ? {} : { boxShadow: '0 4px 12px var(--status-success-bg)' })
      };
    case 'danger':
      return { 
        backgroundColor: 'var(--status-error-hover)',
        ...(isIconButton ? {} : { boxShadow: '0 4px 12px var(--status-error-bg)' })
      };
    case 'warning':
      return { 
        backgroundColor: 'var(--status-warning-hover)',
        ...(isIconButton ? {} : { boxShadow: '0 4px 12px var(--status-warning-bg)' })
      };
    case 'ghost':
      return { backgroundColor: 'var(--bg-tertiary)' };
    case 'outline':
      return { backgroundColor: 'var(--bg-tertiary)' };
    case 'cosmic':
      return {}; // CSS class'ında tanımlı, inline hover style'ları kaldırıyoruz
    default:
      return {};
  }
};

const createButtonHandlers = (
  disabled: boolean | undefined,
  loading: boolean,
  variant: ButtonVariant,
  isIconButton: boolean,
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const hoverStyles = getHoverStyles(variant, isIconButton);
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const variantStyles = getVariantStyles(variant, isIconButton) as any;
    e.currentTarget.style.backgroundColor = variantStyles.backgroundColor || 'transparent';
  };

  return { handleClick, handleMouseEnter, handleMouseLeave };
};

const LoadingSpinner = ({ size }: { size: number }) => (
  <div
    style={{
      width: size,
      height: size,
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}
  />
);

const SpinAnimation = () => (
  <style jsx>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}</style>
);

const CosmicAnimation = () => null; // CSS artık globals.css'de

const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled,
  children,
  className,
  style,
  onClick,
  tooltip,
  ...props
}) => {
  const { handleClick, handleMouseEnter, handleMouseLeave } = createButtonHandlers(
    disabled,
    loading,
    variant,
    false, // isIconButton
    onClick
  );

  const buttonStyles = {
    ...getVariantStyles(variant, false),
    ...getSizeStyles(size, false),
    width: 'auto',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    ...style
  };

  const cosmicClassName = variant === 'cosmic' ? 'cosmic-button' : '';
  const finalClassName = className ? `${className} ${cosmicClassName}` : cosmicClassName;

  const iconSize = getIconSize(size);

  return (
    <button
      {...props}
      style={buttonStyles}
      className={finalClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={tooltip}
    >
      {loading && <LoadingSpinner size={iconSize} />}
      
      {!loading && Icon && <Icon size={iconSize} />}
      
      {children && <span>{children}</span>}
      
      <SpinAnimation />
      <CosmicAnimation />
    </button>
  );
};

// IconButton Component
const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className,
  style,
  onClick,
  tooltip,
  ...props
}) => {
  const { handleClick, handleMouseEnter, handleMouseLeave } = createButtonHandlers(
    disabled,
    loading,
    variant,
    true, // isIconButton
    onClick
  );

  const buttonStyles = {
    ...getVariantStyles(variant, true),
    ...getSizeStyles(size, true),
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
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
      {loading ? <LoadingSpinner size={iconSize} /> : <Icon size={iconSize} />}
      <SpinAnimation />
    </button>
  );
};

// ButtonGroup Component
const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  spacing = 'sm',
  className,
  style
}) => {
  const getSpacing = (spacing: string) => {
    switch (spacing) {
      case 'none': return '0';
      case 'xs': return '0.25rem';
      case 'sm': return '0.5rem';
      case 'md': return '0.75rem';
      case 'lg': return '1rem';
      default: return '0.5rem';
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: getSpacing(spacing),
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    ...style
  };

  return (
    <div style={containerStyles} className={className}>
      {children}
    </div>
  );
};

export default Button;
export { IconButton, ButtonGroup };
