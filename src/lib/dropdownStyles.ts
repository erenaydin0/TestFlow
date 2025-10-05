import { CSSProperties } from 'react';

type DropdownPosition = 'top' | 'bottom';

interface FixedPosition {
  top?: number;
  left: number;
  width: number;
}

/**
 * Dropdown container için ortak stil döndürür
 */
export const getDropdownContainerStyle = (
  dropdownPosition: DropdownPosition,
  additionalStyles?: CSSProperties,
  fixedPosition?: FixedPosition | null
): CSSProperties => {
  const baseStyles: CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    ...additionalStyles
  };

  // Fixed position kullanılıyorsa
  if (fixedPosition) {
    return {
      ...baseStyles,
      position: 'fixed',
      top: fixedPosition.top,
      left: fixedPosition.left,
      width: fixedPosition.width
    };
  }

  // Absolute position (default)
  return {
    ...baseStyles,
    position: 'absolute',
    ...(dropdownPosition === 'top' 
      ? { bottom: '100%', marginBottom: '0.25rem' }
      : { top: '100%', marginTop: '0.25rem' }
    ),
    left: 0,
    right: 0
  };
};

/**
 * Dropdown option için hover efektli stil döndürür
 */
export const getDropdownOptionHandlers = (isSelected: boolean) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  }
});

/**
 * Dropdown button için hover efektli stil döndürür
 */
export const getButtonHoverHandlers = (isOpen: boolean) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOpen) {
      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOpen) {
      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
    }
  }
});
