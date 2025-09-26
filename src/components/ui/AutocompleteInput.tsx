'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  multiple?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  multiple = false,
  onFocus,
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Multiple değerler için parsing
  const getSelectedValues = (): string[] => {
    if (!multiple) return [];
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  };

  // Mevcut input değerini al (multiple mode'da son yazılan kısım)
  const getCurrentInputValue = (): string => {
    if (!multiple) return value || '';
    return currentInput;
  };

  // Input değerini güncelle
  const updateCurrentInput = (newInput: string) => {
    setCurrentInput(newInput);
    if (!multiple) {
      onChange(newInput);
    }
  };

  // Filtreleme
  useEffect(() => {
    const inputValue = getCurrentInputValue().toLowerCase();
    const selectedValues = getSelectedValues();
    
    if (!inputValue) {
      setFilteredOptions(
        options.filter(option => !selectedValues.includes(option)).slice(0, 10)
      );
    } else {
      const filtered = options
        .filter(option => 
          option.toLowerCase().includes(inputValue) &&
          !selectedValues.includes(option)
        )
        .slice(0, 10);
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [currentInput, value, options, multiple]);

  // Component mount/update sırasında current input'u sync et
  useEffect(() => {
    if (!multiple) {
      setCurrentInput(value || '');
    } else {
      // Multiple mode'da, eğer value boşsa current input'u da temizle
      if (!value) {
        setCurrentInput('');
      }
    }
  }, [value, multiple]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            selectOption(filteredOptions[highlightedIndex]);
          } else if (getCurrentInputValue().trim()) {
            // Manual input'u ekle
            addManualValue(getCurrentInputValue().trim());
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case ',':
          if (multiple && getCurrentInputValue().trim()) {
            e.preventDefault();
            addManualValue(getCurrentInputValue().trim());
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, filteredOptions, currentInput]);

  // Dışarı tıklama
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Multiple mode'da manuel değer varsa ekle
        if (multiple && getCurrentInputValue().trim()) {
          addManualValue(getCurrentInputValue().trim());
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentInput, multiple]);

  const selectOption = (option: string) => {
    if (multiple) {
      const selectedValues = getSelectedValues();
      
      // Seçili değer zaten var mı kontrol et
      if (selectedValues.includes(option)) {
        return;
      }
      
      // Yeni değeri ekle
      const newValues = [...selectedValues, option];
      onChange(newValues.join(', '));
      setCurrentInput(''); // Input'u temizle
    } else {
      onChange(option);
      setIsOpen(false);
    }
    
    inputRef.current?.focus();
  };

  const addManualValue = (newValue: string) => {
    if (!multiple) {
      onChange(newValue);
      return;
    }

    const selectedValues = getSelectedValues();
    
    // Değer zaten seçili mi?
    if (selectedValues.includes(newValue)) {
      setCurrentInput('');
      return;
    }

    // Yeni değeri ekle
    const newValues = [...selectedValues, newValue];
    onChange(newValues.join(', '));
    setCurrentInput('');
  };

  const removeValue = (valueToRemove: string) => {
    if (!multiple) return;
    
    const selectedValues = getSelectedValues();
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    onChange(newValues.join(', '));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCurrentInput(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsOpen(true);
    onFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Dropdown'daki seçeneklere tıklama için küçük bir gecikme
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
    onBlur?.(e);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Selected values (multiple mode) */}
      {multiple && getSelectedValues().length > 0 && (
        <div style={{ 
          marginBottom: '0.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {getSelectedValues().map((val, index) => (
            <span
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-primary)'
              }}
            >
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={getCurrentInputValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem',
            paddingRight: '2rem',
            border: '1px solid var(--border-primary)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.2s'
          }}
        >
          <ChevronDown 
            size={16} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '0.25rem'
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              onClick={() => selectOption(option)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                backgroundColor: index === highlightedIndex ? 'var(--bg-tertiary)' : 'transparent',
                borderBottom: index < filteredOptions.length - 1 ? '1px solid var(--border-primary)' : 'none',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;