'use client';

import { useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useDropdown } from '@/hooks/ui';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz',
  className = '',
  style = {}
}) => {
  const {
    isOpen,
    isClosing,
    dropdownPosition,
    containerRef,
    buttonRef,
    dropdownRef,
    handleClose,
    handleToggle,
    getAnimationStyle
  } = useDropdown({ animationDuration: 150 });

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ 
        position: 'relative',
        width: '100%'
      }}
    >
      {/* Display Button */}
      <div
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: '0.375rem 0.5rem',
          borderRadius: '0.5rem',
          transition: 'all 0.2s ease',
          border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
          minWidth: '120px',
          ...style
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
          }
        }}
      >
        <span style={{ flex: 1 }}>{displayText}</span>
        <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            ...(dropdownPosition === 'top' 
              ? { bottom: '100%', marginBottom: '0.25rem' }
              : { top: '100%', marginTop: '0.25rem' }
            ),
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '250px',
            overflowY: 'auto',
            ...getAnimationStyle(200)
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  handleClose();
                }}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}>
                  {option.label}
                </span>
                {isSelected && (
                  <Check size={14} style={{ color: 'white' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
