'use client';

import { ChevronDown, Check } from 'lucide-react';
import { useDropdown } from '@/hooks/ui';
import { getDropdownContainerStyle, getDropdownOptionHandlers, getButtonHoverHandlers } from '@/lib/dropdownStyles';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  useFixedPosition?: boolean; // Tablo içinde kullanım için
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz',
  className = '',
  style = {},
  useFixedPosition = false
}) => {
  const {
    isOpen,
    isClosing,
    dropdownPosition,
    fixedPosition,
    containerRef,
    buttonRef,
    dropdownRef,
    handleClose,
    handleToggle,
    getAnimationStyle
  } = useDropdown({ 
    animationDuration: 150,
    useFixedPosition
  });

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
          border: '1px solid var(--border-primary)',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
          minWidth: '120px',
          ...style
        }}
        {...getButtonHoverHandlers(isOpen)}
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
            ...getDropdownContainerStyle(
              dropdownPosition, 
              {
                maxHeight: '250px',
                overflowY: 'auto',
                width: fixedPosition?.width
              },
              fixedPosition
            ),
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
                {...getDropdownOptionHandlers(isSelected)}
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
