'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserType } from '@/types';

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const browserOptions = [
  { value: 'chromium' as BrowserType, label: 'Chrome' },    
  { value: 'firefox' as BrowserType, label: 'Firefox' },
  { value: 'webkit' as BrowserType, label: 'Safari' },
  { value: 'msedge' as BrowserType, label: 'Edge' }
];

export default function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  disabled = false,
  size = 'sm',
  style = {}
}: BrowserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = browserOptions.find(option => option.value === selectedBrowser);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 200; // Approximate dropdown height

      // If not enough space below but more space above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);


  // Size configurations
  const sizeConfig = {
    sm: {
      padding: '0.375rem 0.5rem',
      fontSize: '0.8rem',
      minWidth: '90px',
      iconSize: 14
    },
    md: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      minWidth: '120px',
      iconSize: 16
    },
    lg: {
      padding: '0.625rem 1rem',
      fontSize: '0.9rem',
      minWidth: '140px',
      iconSize: 18
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: currentSize.padding,
          borderRadius: '0.5rem',
          color: 'var(--text-primary)',
          fontSize: currentSize.fontSize,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          minWidth: currentSize.minWidth,
          width: '100%',
          ...style
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '';
          }
        }}
      >
        <span>{selectedOption?.label || 'Chrome'}</span>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 12 12" 
          fill="none"
          style={{ 
            marginLeft: 'auto',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path 
            d="M3 4.5L6 7.5L9 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              ...(dropdownPosition === 'top' 
                ? { bottom: '100%', marginBottom: '0.25rem' }
                : { top: '100%', marginTop: '0.25rem' }
              ),
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 20,
              overflow: 'hidden'
            }}
          >
            {browserOptions.map((option) => {
              const isSelected = option.value === selectedBrowser;
              
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onBrowserChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
