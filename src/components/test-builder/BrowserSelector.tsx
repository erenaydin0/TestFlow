'use client';

import { useState } from 'react';
import { Globe, Chrome } from 'lucide-react';
import { BrowserType } from '@/types';

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  disabled?: boolean;
}

const browserOptions = [
  { value: 'chromium' as BrowserType, label: 'Chrome', icon: Chrome, color: '#4285F4' },    
  { value: 'firefox' as BrowserType, label: 'Firefox', icon: Globe, color: '#FF7139' },
  { value: 'webkit' as BrowserType, label: 'Safari', icon: Globe, color: '#007AFF' },
  { value: 'msedge' as BrowserType, label: 'Edge', icon: Globe, color: '#0078D4' }
];

export default function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  disabled = false 
}: BrowserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = browserOptions.find(option => option.value === selectedBrowser);
  const SelectedIconComponent = selectedOption?.icon || Chrome;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '0.5rem',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          minWidth: '120px'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }
        }}
      >
        <SelectedIconComponent 
          size={16} 
          style={{ color: selectedOption?.color || '#4285F4' }} 
        />
        <span>{selectedOption?.label || 'Chrome'}</span>
        <svg 
          width="12" 
          height="12" 
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
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 20,
              overflow: 'hidden'
            }}
          >
            {browserOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = option.value === selectedBrowser;
              
              return (
                <button
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
                    padding: '0.75rem',
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
                  <IconComponent 
                    size={16} 
                    style={{ color: isSelected ? 'white' : option.color }} 
                  />
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none"
                      style={{ marginLeft: 'auto' }}
                    >
                      <path 
                        d="M13.5 4.5L6 12L2.5 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
