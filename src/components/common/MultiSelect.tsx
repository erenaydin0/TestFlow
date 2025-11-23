'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import { useDropdown } from '@/hooks';
import { getDropdownContainerStyle, getDropdownOptionHandlers } from '@/utils/utils';
import { useI18n } from '@/hooks';

interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  renderOption?: (option: string) => React.ReactNode;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder,
  className = "",
  renderOption
}: MultiSelectProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    isClosing,
    dropdownPosition,
    containerRef,
    buttonRef,
    dropdownRef: dropdownContentRef,
    handleClose,
    handleToggle,
    getAnimationStyle
  } = useDropdown({ 
    animationDuration: 200,
    onClose: () => setSearchTerm('')
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleToggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleRemoveValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };


  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return t('multiSelect.itemsSelected', { count: selectedValues.length });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ position: 'relative' }}
    >
      <div
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.375rem 0.5rem',
          border: '1px solid var(--border-primary)',
          borderRadius: '0.375rem',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          minWidth: '120px',
          cursor: 'pointer',
          minHeight: '32px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.25rem',
          flex: 1,
          alignItems: 'center'
        }}>
          {selectedValues.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              {placeholder || t('multiSelect.select')}
            </span>
          ) : selectedValues.length === 1 ? (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              padding: '0.125rem 0.375rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}>
              {selectedValues[0]}
              <X 
                size={12} 
                onClick={(e) => handleRemoveValue(selectedValues[0], e)}
                style={{ cursor: 'pointer', opacity: 0.7 }}
              />
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem' }}>
              {t('multiSelect.itemsSelected', { count: selectedValues.length })}
            </span>
          )}
        </div>
        <ChevronDown 
          size={14} 
          style={{ 
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownContentRef}
          style={{
            ...getDropdownContainerStyle(dropdownPosition, {
              borderRadius: '0.375rem',
              maxHeight: '250px',
              overflowY: 'hidden'
            }),
            ...getAnimationStyle()
          }}
        >
          {/* Search Input */}
          <div style={{ 
            padding: '0.5rem',
            borderBottom: '1px solid var(--border-primary)',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--bg-primary)'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ 
                position: 'absolute', 
                left: '0.5rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-secondary)' 
              }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('searchPlaceholders.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.375rem 0.5rem 0.375rem 2rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>


          {/* Options List */}
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ 
                padding: '1rem', 
                textAlign: 'center',
                color: 'var(--text-secondary)', 
                fontSize: '0.75rem' 
              }}>
                {searchTerm ? t('common.noSearchResults') : t('common.noOptions')}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOption(option);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    backgroundColor: selectedValues.includes(option) ? 'var(--bg-tertiary)' : 'transparent',
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border-primary)'
                  }}
                  {...getDropdownOptionHandlers(selectedValues.includes(option))}
                >
                  <span>{renderOption ? renderOption(option) : option}</span>
                  {selectedValues.includes(option) && (
                    <Check size={14} style={{ color: 'var(--status-success)' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected values as tags (when multiple selected) */}
      {selectedValues.length > 1 && (
        <div style={{ 
          marginTop: '0.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {selectedValues.map((value) => (
            <span
              key={value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.125rem 0.375rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-primary)'
              }}
            >
              {value}
              <X 
                size={12} 
                onClick={(e) => handleRemoveValue(value, e)}
                style={{ cursor: 'pointer', opacity: 0.7 }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
